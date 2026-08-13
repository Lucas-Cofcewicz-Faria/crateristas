import type { HeadBlobResult, PutBlobResult, del, head } from '@vercel/blob';
import type { HandleUploadBody, handleUpload } from '@vercel/blob/client';
import type { MemberRecord, ReviewRepository } from '@/domain/reviews/repository';
import {
  createReviewService,
  type ReviewService,
  VisitPhotoAuthorizationError,
  VisitPhotoCapacityError,
} from '@/domain/reviews/service';
import {
  MAX_VISIT_PHOTO_BYTES,
  PhotoPolicyError,
  VISIT_PHOTO_CONTENT_TYPE,
  assertVisitPhotoOutput,
  validateCompletedVisitPhotoPathname,
  validatePhotoIdentifier,
  validateRequestedVisitPhotoPathname,
} from '@/features/visits/photo-policy';
import { createNeonReviewRepository } from '@/lib/repositories/neon-review-repository';

type RouteContext = { params: Promise<{ id: string }> };

export interface VisitPhotoRouteDependencies {
  requireMember(): Promise<MemberRecord>;
  repository: ReviewRepository;
  service: ReviewService;
  handleUpload: typeof handleUpload;
  head: typeof head;
  del: typeof del;
  isBlobNotFoundError(error: unknown): boolean;
}

class PhotoRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoRequestError';
  }
}

function photoErrorResponse(error: unknown): Response {
  if (error instanceof VisitPhotoAuthorizationError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof VisitPhotoCapacityError) {
    return Response.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof PhotoPolicyError || error instanceof PhotoRequestError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof Error && error.name === 'AuthenticationError') {
    return Response.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  }
  if (error instanceof Error && error.name === 'AuthorizationError') {
    return Response.json({ error: 'Você não tem permissão para esta ação.' }, { status: 403 });
  }
  return Response.json({ error: 'Não foi possível concluir a operação.' }, { status: 500 });
}

async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new PhotoRequestError('O corpo da requisição deve conter JSON válido.');
  }
}

function parseTokenPayload(value: string | null | undefined): { visitId: string; memberId: string } {
  if (!value) throw new PhotoRequestError('O comprovante do upload é inválido.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new PhotoRequestError('O comprovante do upload é inválido.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new PhotoRequestError('O comprovante do upload é inválido.');
  }
  const payload = parsed as Record<string, unknown>;
  if (Object.keys(payload).sort().join(',') !== 'memberId,visitId'
    || typeof payload.visitId !== 'string' || typeof payload.memberId !== 'string') {
    throw new PhotoRequestError('O comprovante do upload é inválido.');
  }
  return {
    visitId: validatePhotoIdentifier(payload.visitId, 'O identificador da visita é inválido.'),
    memberId: validatePhotoIdentifier(payload.memberId, 'O identificador do membro é inválido.'),
  };
}

function validateBlobUrl(blob: PutBlobResult, visitId: string): string {
  validateCompletedVisitPhotoPathname(visitId, blob.pathname);
  let parsed: URL;
  try {
    parsed = new URL(blob.url);
  } catch {
    throw new PhotoRequestError('A referência da foto enviada é inválida.');
  }
  if (parsed.protocol !== 'https:'
    || !parsed.hostname.endsWith('.blob.vercel-storage.com')
    || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash) {
    throw new PhotoRequestError('A referência da foto enviada é inválida.');
  }
  let urlPathname: string;
  try {
    urlPathname = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new PhotoRequestError('A referência da foto enviada é inválida.');
  }
  if (urlPathname !== blob.pathname) {
    throw new PhotoRequestError('A referência da foto enviada é inválida.');
  }
  return blob.url;
}

function validateHeadMetadata(
  metadata: HeadBlobResult,
  blob: PutBlobResult,
  visitId: string,
): void {
  if (metadata.pathname !== blob.pathname || metadata.url !== blob.url) {
    throw new PhotoRequestError('Os metadados da foto enviada são inválidos.');
  }
  validateCompletedVisitPhotoPathname(visitId, metadata.pathname);
  assertVisitPhotoOutput(metadata.contentType, metadata.size);
  assertVisitPhotoOutput(blob.contentType, metadata.size);
}

function parsePhotoId(body: unknown): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || typeof (body as Record<string, unknown>).photoId !== 'string') {
    throw new PhotoRequestError('Informe a foto que deve ser removida.');
  }
  return validatePhotoIdentifier(
    (body as Record<string, string>).photoId,
    'O identificador da foto é inválido.',
  );
}

export function createVisitPhotoRouteHandlers(
  resolveDependencies: () => Promise<VisitPhotoRouteDependencies>,
) {
  return {
    async GET(request: Request, context: RouteContext): Promise<Response> {
      try {
        const dependencies = await resolveDependencies();
        await dependencies.requireMember();
        const { id: rawVisitId } = await context.params;
        const visitId = validatePhotoIdentifier(rawVisitId, 'O identificador da visita é inválido.');
        const rawPathname = new URL(request.url).searchParams.get('pathname') ?? '';
        const pathname = validateCompletedVisitPhotoPathname(visitId, rawPathname);
        const photo = await dependencies.repository.findPhotoByPathname(pathname);
        if (!photo) {
          try {
            await dependencies.head(pathname);
          } catch (error) {
            if (dependencies.isBlobNotFoundError(error)) {
              return Response.json(
                { error: 'O processamento da foto falhou. Envie novamente.' },
                { status: 410, headers: { 'cache-control': 'no-store' } },
              );
            }
            throw error;
          }
          return Response.json(
            { photo: null },
            { status: 202, headers: { 'cache-control': 'no-store' } },
          );
        }
        if (photo.visitId !== visitId || photo.pathname !== pathname) {
          throw new Error('A confirmação da foto não corresponde à visita.');
        }
        return Response.json(
          {
            photo: {
              id: photo.id,
              url: photo.url,
              position: photo.position,
            },
          },
          { headers: { 'cache-control': 'no-store' } },
        );
      } catch (error) {
        return photoErrorResponse(error);
      }
    },

    async POST(request: Request, context: RouteContext): Promise<Response> {
      try {
        const { id: rawVisitId } = await context.params;
        const visitId = validatePhotoIdentifier(rawVisitId, 'O identificador da visita é inválido.');
        const body = await parseRequestBody(request) as HandleUploadBody;
        const dependencies = await resolveDependencies();
        const result = await dependencies.handleUpload({
          body,
          request,
          onBeforeGenerateToken: async (pathname) => {
            const actor = await dependencies.requireMember();
            const memberId = validatePhotoIdentifier(
              actor.id,
              'O identificador do membro é inválido.',
            );
            validateRequestedVisitPhotoPathname(visitId, pathname);
            await dependencies.service.authorizePhotoUpload(actor, visitId);
            return {
              allowedContentTypes: [VISIT_PHOTO_CONTENT_TYPE],
              maximumSizeInBytes: MAX_VISIT_PHOTO_BYTES,
              addRandomSuffix: true,
              tokenPayload: JSON.stringify({ visitId, memberId }),
            };
          },
          onUploadCompleted: async ({ blob, tokenPayload }) => {
            let cleanupTarget: string | null = null;
            try {
              cleanupTarget = validateBlobUrl(blob, visitId);
              const signed = parseTokenPayload(tokenPayload);
              if (signed.visitId !== visitId) {
                throw new PhotoRequestError('O comprovante do upload não corresponde à visita.');
              }
              const actor = await dependencies.repository.findMemberById(signed.memberId);
              if (!actor) throw new Error('Membro do upload não encontrado.');
              const metadata = await dependencies.head(blob.url);
              validateHeadMetadata(metadata, blob, visitId);
              await dependencies.service.attachPhoto(actor, visitId, {
                url: blob.url,
                pathname: blob.pathname,
                contentType: VISIT_PHOTO_CONTENT_TYPE,
                sizeBytes: metadata.size,
              });
            } catch (error) {
              if (cleanupTarget) {
                try {
                  await dependencies.del(cleanupTarget);
                } catch {
                  // O erro original determina o retry do callback; cleanup pode ser repetido.
                }
              }
              throw error;
            }
          },
        });
        return Response.json(result);
      } catch (error) {
        return photoErrorResponse(error);
      }
    },

    async DELETE(request: Request, context: RouteContext): Promise<Response> {
      try {
        const { id: rawVisitId } = await context.params;
        const visitId = validatePhotoIdentifier(rawVisitId, 'O identificador da visita é inválido.');
        const dependencies = await resolveDependencies();
        const actor = await dependencies.requireMember();
        const photoId = parsePhotoId(await parseRequestBody(request));
        const photo = await dependencies.service.preparePhotoRemoval(actor, visitId, photoId);
        if (!photo) return new Response(null, { status: 204 });

        const trustedPathname = validateCompletedVisitPhotoPathname(visitId, photo.pathname);
        try {
          await dependencies.del(trustedPathname);
        } catch (error) {
          if (!dependencies.isBlobNotFoundError(error)) throw error;
        }

        const removed = await dependencies.service.removePhoto(actor, visitId, photoId);
        if (!removed) {
          const stillPresent = await dependencies.service.preparePhotoRemoval(actor, visitId, photoId);
          if (stillPresent) throw new Error('Não foi possível remover os metadados da foto.');
        }
        return new Response(null, { status: 204 });
      } catch (error) {
        return photoErrorResponse(error);
      }
    },
  };
}

async function resolveProductionDependencies(): Promise<VisitPhotoRouteDependencies> {
  const [blobClient, blobServer, authAccess] = await Promise.all([
    import('@vercel/blob/client'),
    import('@vercel/blob'),
    import('@/lib/auth/access'),
  ]);
  const repository = createNeonReviewRepository();
  return {
    requireMember: authAccess.requireMember,
    repository,
    service: createReviewService(repository),
    handleUpload: blobClient.handleUpload,
    head: blobServer.head,
    del: blobServer.del,
    isBlobNotFoundError: (error) => error instanceof blobServer.BlobNotFoundError,
  };
}

const productionHandlers = createVisitPhotoRouteHandlers(resolveProductionDependencies);

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return productionHandlers.GET(request, context);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return productionHandlers.POST(request, context);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return productionHandlers.DELETE(request, context);
}
