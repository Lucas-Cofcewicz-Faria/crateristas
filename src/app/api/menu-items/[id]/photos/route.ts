import type { PutBlobResult, del, put } from '@vercel/blob';

const MAX_PHOTO_BYTES = 750_000;
const PHOTO_CONTENT_TYPE = 'image/webp';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ id: string }> };

interface MenuPhotoActor {
  id: string;
}

export interface MenuPhotoRouteDependencies {
  requireMember(): Promise<MenuPhotoActor>;
  canManageMenuPhotos(actorId: string, itemId: string): Promise<boolean>;
  attachMenuPhoto(actorId: string, itemId: string, url: string, pathname: string): Promise<boolean>;
  put: typeof put;
  del: typeof del;
  randomUUID(): string;
}

class MenuPhotoRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'MenuPhotoRequestError';
  }
}

function errorResponse(error: unknown): Response {
  if (error instanceof MenuPhotoRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.name === 'AuthenticationError') {
    return Response.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  }
  if (error instanceof Error && error.name === 'AuthorizationError') {
    return Response.json({ error: 'Você não tem permissão para esta ação.' }, { status: 403 });
  }
  return Response.json({ error: 'Não foi possível enviar a foto.' }, { status: 500 });
}

function validatedUuid(value: string, message: string): string {
  if (!UUID_PATTERN.test(value)) throw new MenuPhotoRequestError(message, 400);
  return value.toLowerCase();
}

function assertSameOrigin(request: Request): void {
  const source = request.headers.get('origin');
  let expected: string;
  try {
    expected = new URL(request.url).origin;
  } catch {
    throw new MenuPhotoRequestError('A origem da requisição é inválida.', 403);
  }
  if (!source || source !== expected) {
    throw new MenuPhotoRequestError('A origem da requisição não é permitida.', 403);
  }
}

async function uploadedFile(request: Request): Promise<File> {
  let body: FormData;
  try {
    body = await request.formData();
  } catch {
    throw new MenuPhotoRequestError('Envie a foto como formulário.', 400);
  }
  const photo = body.get('photo');
  if (!(photo instanceof File)) {
    throw new MenuPhotoRequestError('Selecione uma foto.', 400);
  }
  if (photo.type !== PHOTO_CONTENT_TYPE) {
    throw new MenuPhotoRequestError('A foto deve estar comprimida em WebP.', 400);
  }
  if (!Number.isInteger(photo.size) || photo.size < 1 || photo.size > MAX_PHOTO_BYTES) {
    throw new MenuPhotoRequestError('A foto comprimida deve ter no máximo 750.000 bytes.', 400);
  }
  const header = new Uint8Array(await photo.slice(0, 12).arrayBuffer());
  const signature = (start: number, text: string) => [...text].every((char, offset) => header[start + offset] === char.charCodeAt(0));
  if (!signature(0, 'RIFF') || !signature(8, 'WEBP')) {
    throw new MenuPhotoRequestError('O arquivo não é uma imagem WebP válida. Selecione a foto novamente.', 400);
  }
  return photo;
}

export function createMenuPhotoRouteHandlers(
  resolveDependencies: () => Promise<MenuPhotoRouteDependencies>,
) {
  return {
    async POST(request: Request, context: RouteContext): Promise<Response> {
      let uploaded: PutBlobResult | null = null;
      let dependencies: MenuPhotoRouteDependencies | null = null;
      try {
        assertSameOrigin(request);
        const { id: rawItemId } = await context.params;
        const itemId = validatedUuid(rawItemId, 'O identificador do item é inválido.');
        dependencies = await resolveDependencies();
        const actor = await dependencies.requireMember();
        const actorId = validatedUuid(actor.id, 'O identificador do membro é inválido.');
        if (!await dependencies.canManageMenuPhotos(actorId, itemId)) {
          throw new MenuPhotoRequestError(
            'Apenas quem cadastrou o prato ou um administrador pode adicionar fotos.',
            403,
          );
        }

        const photo = await uploadedFile(request);
        const photoId = validatedUuid(dependencies.randomUUID(), 'Não foi possível preparar a foto.');
        const pathname = `menu-items/${itemId}/${photoId}.webp`;
        uploaded = await dependencies.put(pathname, photo, {
          access: 'public',
          addRandomSuffix: false,
          contentType: PHOTO_CONTENT_TYPE,
        });

        const attached = await dependencies.attachMenuPhoto(
          actorId,
          itemId,
          uploaded.url,
          uploaded.pathname,
        );
        if (!attached) {
          throw new MenuPhotoRequestError('O item já possui o máximo de cinco fotos.', 409);
        }

        return Response.json({
          photo: { url: uploaded.url, pathname: uploaded.pathname },
        }, { status: 201 });
      } catch (error) {
        if (uploaded && dependencies) {
          try {
            await dependencies.del(uploaded.pathname);
          } catch {
            // O erro original é mais útil; o Blob órfão pode ser removido por manutenção posterior.
          }
        }
        return errorResponse(error);
      }
    },
  };
}

async function resolveProductionDependencies(): Promise<MenuPhotoRouteDependencies> {
  const [blob, crypto, auth, repository] = await Promise.all([
    import('@vercel/blob'),
    import('node:crypto'),
    import('@/lib/auth/access'),
    import('@/features/menu/menu-repository'),
  ]);
  return {
    requireMember: auth.requireMember,
    canManageMenuPhotos: repository.canManageMenuPhotos,
    attachMenuPhoto: repository.attachMenuPhoto,
    put: blob.put,
    del: blob.del,
    randomUUID: crypto.randomUUID,
  };
}

const productionHandlers = createMenuPhotoRouteHandlers(resolveProductionDependencies);

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return productionHandlers.POST(request, context);
}
