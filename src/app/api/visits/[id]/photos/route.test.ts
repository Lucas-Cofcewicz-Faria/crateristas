import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HandleUploadBody, HandleUploadOptions } from '@vercel/blob/client';
import type { HeadBlobResult, PutBlobResult } from '@vercel/blob';
import type {
  MemberRecord,
  PhotoInput,
  PhotoRecord,
  ReviewRepository,
  VisitRecord,
} from '@/domain/reviews/repository';
import { createReviewService } from '@/domain/reviews/service';
import {
  createVisitPhotoRouteHandlers,
  type VisitPhotoRouteDependencies,
} from './route';

const visitId = '8f3f44cf-2db1-4c46-a0b0-94f29cb8f26a';
const creatorId = '75cdbdf1-5320-4d7c-89f8-91a3fa11b1bb';
const otherId = 'a8041f12-bba3-4ceb-97e5-85e39684f339';
const adminId = '1bf772d2-2b40-4f5d-8db7-e05dfbb904f1';

function member(id: string, role: MemberRecord['role'] = 'member'): MemberRecord {
  return {
    id,
    authUserId: `auth-${id}`,
    email: `${id}@example.com`,
    slug: id,
    displayName: role === 'admin' ? 'Administrador' : 'Craterista',
    avatarUrl: null,
    societyTitle: null,
    memberNumber: role === 'admin' ? 8 : 1,
    bio: '',
    favoriteCuisine: null,
    role,
  };
}

const creator = member(creatorId);
const other = member(otherId);
const admin = member(adminId, 'admin');

function photoPath(name: string): string {
  return `visits/${visitId}/${name}.webp`;
}

function blob(name: string): PutBlobResult {
  const pathname = photoPath(name);
  return {
    url: `https://arquivos.public.blob.vercel-storage.com/${pathname}`,
    downloadUrl: `https://arquivos.public.blob.vercel-storage.com/${pathname}?download=1`,
    pathname,
    contentType: 'image/webp',
    contentDisposition: 'inline',
    etag: `etag-${name}`,
  };
}

function headResult(uploaded: PutBlobResult, size = 120_000): HeadBlobResult {
  return {
    url: uploaded.url,
    downloadUrl: uploaded.downloadUrl,
    pathname: uploaded.pathname,
    contentType: uploaded.contentType,
    contentDisposition: uploaded.contentDisposition,
    size,
    uploadedAt: new Date('2026-08-11T12:00:00.000Z'),
    etag: uploaded.etag,
    cacheControl: 'public, max-age=31536000',
  };
}

class PhotoRepository {
  readonly members = new Map([creator, other, admin].map((record) => [record.id, record]));
  readonly photos = new Map<string, PhotoRecord>();
  readonly visit: VisitRecord = {
    id: visitId,
    slug: 'visita-do-crater',
    restaurantId: '78002c78-3e2e-4899-a108-0a70d2281675',
    createdBy: creator.id,
    visitedAt: '2026-08-10',
    quorum: 6,
    publicationState: 'private',
    publicationReason: null,
    publishedAt: null,
    publishedBy: null,
    hiddenAt: null,
    hiddenBy: null,
    legacyReviewId: null,
    legacyPayload: null,
  };
  nextPhotoNumber = 1;
  deleteFailure: Error | null = null;

  async findMemberById(id: string) {
    return this.members.get(id) ?? null;
  }

  async findVisitById(id: string) {
    return id === visitId ? this.visit : null;
  }

  async countVisitPhotos(id: string) {
    return [...this.photos.values()].filter((photo) => photo.visitId === id).length;
  }

  async attachPhoto(id: string, actorId: string, input: PhotoInput) {
    const used = new Set([...this.photos.values()].filter((photo) => photo.visitId === id)
      .map((photo) => photo.position));
    const position = [1, 2, 3, 4, 5].find((candidate) => !used.has(candidate));
    if (!position) throw new Error('A visita já possui o máximo de cinco fotos.');
    const photoId = `00000000-0000-4000-8000-${String(this.nextPhotoNumber).padStart(12, '0')}`;
    this.nextPhotoNumber += 1;
    this.photos.set(photoId, {
      id: photoId,
      visitId: id,
      uploadedBy: actorId,
      position,
      ...input,
    });
  }

  async findPhotoById(id: string) {
    return this.photos.get(id) ?? null;
  }

  async findPhotoByPathname(pathname: string) {
    return [...this.photos.values()].find((photo) => photo.pathname === pathname) ?? null;
  }

  async deletePhoto(id: string, photoId: string) {
    if (this.deleteFailure) {
      const error = this.deleteFailure;
      this.deleteFailure = null;
      throw error;
    }
    const photo = this.photos.get(photoId);
    if (!photo || photo.visitId !== id) return null;
    this.photos.delete(photoId);
    return photo;
  }
}

function generateBody(pathname = photoPath('mesa-do-fundo')): HandleUploadBody {
  return {
    type: 'blob.generate-client-token',
    payload: {
      pathname,
      multipart: false,
      clientPayload: JSON.stringify({ visitId: otherId, memberId: otherId }),
    },
  };
}

function completedBody(uploaded: PutBlobResult, memberId = creator.id): HandleUploadBody {
  return {
    type: 'blob.upload-completed',
    payload: {
      blob: uploaded,
      tokenPayload: JSON.stringify({ visitId, memberId }),
    },
  };
}

function jsonRequest(method: string, body: unknown): Request {
  return new Request(`http://localhost/api/visits/${visitId}/photos`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function fakeHandleUpload(options: HandleUploadOptions) {
  if (options.body.type === 'blob.generate-client-token') {
    const { pathname, clientPayload, multipart } = options.body.payload;
    return options.onBeforeGenerateToken(pathname, clientPayload, multipart).then((tokenOptions) => ({
      type: 'blob.generate-client-token' as const,
      clientToken: JSON.stringify(tokenOptions),
    }));
  }
  if (!options.onUploadCompleted) throw new Error('Callback ausente.');
  return options.onUploadCompleted(options.body.payload).then(() => ({
    type: 'blob.upload-completed' as const,
    response: 'ok' as const,
  }));
}

function makeHarness(actor: MemberRecord = creator) {
  const repository = new PhotoRepository();
  const service = createReviewService(repository as unknown as ReviewRepository);
  const deleted: string[] = [];
  const dependencies: VisitPhotoRouteDependencies = {
    requireMember: vi.fn().mockResolvedValue(actor),
    repository: repository as unknown as ReviewRepository,
    service,
    handleUpload: fakeHandleUpload,
    head: vi.fn(async (urlOrPathname: string) => {
      const uploaded = [...repository.photos.values()].find((photo) => (
        photo.url === urlOrPathname || photo.pathname === urlOrPathname
      ));
      if (uploaded) return headResult({
        ...blob('persistida'),
        url: uploaded.url,
        downloadUrl: `${uploaded.url}?download=1`,
        pathname: uploaded.pathname,
      });
      const pathname = new URL(urlOrPathname).pathname.slice(1);
      return headResult({ ...blob('temporaria'), url: urlOrPathname, pathname });
    }),
    del: vi.fn(async (target: string | string[]) => {
      deleted.push(...(Array.isArray(target) ? target : [target]));
    }),
    isBlobNotFoundError: (error: unknown) => (
      error instanceof Error && error.name === 'BlobNotFoundError'
    ),
  };
  return {
    repository,
    dependencies,
    deleted,
    ...createVisitPhotoRouteHandlers(async () => dependencies),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/visits/[id]/photos', () => {
  it('emite token somente após autenticar e usa apenas IDs validados do servidor', async () => {
    const harness = makeHarness();

    const response = await harness.POST(
      jsonRequest('POST', generateBody()),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(200);
    const sdkResponse = await response.json() as { clientToken: string };
    expect(JSON.parse(sdkResponse.clientToken)).toEqual({
      allowedContentTypes: ['image/webp'],
      maximumSizeInBytes: 750_000,
      addRandomSuffix: true,
      tokenPayload: JSON.stringify({ visitId, memberId: creator.id }),
    });
  });

  it('rejeita membro que não criou a visita antes de emitir token', async () => {
    const harness = makeHarness(other);

    const response = await harness.POST(
      jsonRequest('POST', generateBody()),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Apenas o criador da visita ou um administrador pode gerenciar fotos.',
    });
  });

  it('rejeita a sexta foto e pathname com separador codificado', async () => {
    const fullHarness = makeHarness();
    for (let index = 1; index <= 5; index += 1) {
      await fullHarness.repository.attachPhoto(visitId, creator.id, {
        url: `https://images.example.com/${index}.webp`,
        pathname: photoPath(`foto-${index}`),
        contentType: 'image/webp',
        sizeBytes: 100_000,
      });
    }
    const fullResponse = await fullHarness.POST(
      jsonRequest('POST', generateBody()),
      { params: Promise.resolve({ id: visitId }) },
    );
    expect(fullResponse.status).toBe(409);

    const unsafeHarness = makeHarness();
    const unsafeResponse = await unsafeHarness.POST(
      jsonRequest('POST', generateBody(photoPath('foto%2fsegredo'))),
      { params: Promise.resolve({ id: visitId }) },
    );
    expect(unsafeResponse.status).toBe(400);
  });

  it('persiste callback sem sessão usando membro re-resolvido e metadado obtido no Blob', async () => {
    const harness = makeHarness();
    const expiredSession = new Error('sessão ausente');
    expiredSession.name = 'AuthenticationError';
    (harness.dependencies.requireMember as ReturnType<typeof vi.fn>)
      .mockRejectedValue(expiredSession);
    const uploaded = blob('mesa-do-fundo-random');

    const response = await harness.POST(
      jsonRequest('POST', completedBody(uploaded)),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(200);
    expect(harness.repository.photos.size).toBe(1);
    expect([...harness.repository.photos.values()][0]).toMatchObject({
      visitId,
      uploadedBy: creator.id,
      url: uploaded.url,
      pathname: uploaded.pathname,
      contentType: 'image/webp',
      sizeBytes: 120_000,
    });
  });

  it.each([
    {
      label: 'host não oficial',
      uploaded: {
        ...blob('host-invalido-random'),
        url: `https://arquivos.example.com/${photoPath('host-invalido-random')}`,
      },
      headOverride: null,
      shouldCleanup: false,
    },
    {
      label: 'URL e pathname divergentes no callback',
      uploaded: {
        ...blob('callback-path-random'),
        url: `https://arquivos.public.blob.vercel-storage.com/${photoPath('outro-path-random')}`,
      },
      headOverride: null,
      shouldCleanup: false,
    },
    {
      label: 'contentType não WebP no callback',
      uploaded: { ...blob('callback-png-random'), contentType: 'image/png' },
      headOverride: null,
      shouldCleanup: true,
    },
    {
      label: 'pathname divergente no head',
      uploaded: blob('head-path-random'),
      headOverride: { pathname: photoPath('outro-head-path-random') },
      shouldCleanup: true,
    },
    {
      label: 'MIME divergente no head',
      uploaded: blob('head-png-random'),
      headOverride: { contentType: 'image/png' },
      shouldCleanup: true,
    },
    {
      label: 'tamanho zero no head',
      uploaded: blob('head-zero-random'),
      headOverride: { size: 0 },
      shouldCleanup: true,
    },
    {
      label: 'tamanho acima de 750.000 bytes no head',
      uploaded: blob('head-grande-random'),
      headOverride: { size: 750_001 },
      shouldCleanup: true,
    },
  ] as Array<{
    label: string;
    uploaded: PutBlobResult;
    headOverride: Partial<HeadBlobResult> | null;
    shouldCleanup: boolean;
  }>)(
    'rejeita $label sem persistir e limpa somente um alvo Blob seguro',
    async ({ uploaded, headOverride, shouldCleanup }) => {
      const harness = makeHarness();
      if (headOverride) {
        harness.dependencies.head = vi.fn(async () => ({
          ...headResult(uploaded),
          ...headOverride,
        }));
      }

      const response = await harness.POST(
        jsonRequest('POST', completedBody(uploaded)),
        { params: Promise.resolve({ id: visitId }) },
      );

      expect(response.status).toBe(400);
      expect(harness.repository.photos.size).toBe(0);
      expect(harness.deleted).toEqual(shouldCleanup ? [uploaded.url] : []);
    },
  );

  it('apaga o Blob órfão quando o membro assinado não existe ou perdeu autorização', async () => {
    const missingHarness = makeHarness();
    const missingBlob = blob('membro-ausente-random');
    const missingResponse = await missingHarness.POST(
      jsonRequest('POST', completedBody(missingBlob, 'cf97d641-49e7-4cec-8116-c40a403307d0')),
      { params: Promise.resolve({ id: visitId }) },
    );
    expect(missingResponse.status).toBe(500);
    expect(missingHarness.deleted).toEqual([missingBlob.url]);

    const unauthorizedHarness = makeHarness();
    const unauthorizedBlob = blob('sem-autorizacao-random');
    const unauthorizedResponse = await unauthorizedHarness.POST(
      jsonRequest('POST', completedBody(unauthorizedBlob, other.id)),
      { params: Promise.resolve({ id: visitId }) },
    );
    expect(unauthorizedResponse.status).toBe(403);
    expect(unauthorizedHarness.deleted).toEqual([unauthorizedBlob.url]);
  });

  it('em callbacks concorrentes aceita a quinta foto e limpa a perdedora que tentou a sexta', async () => {
    const harness = makeHarness();
    for (let index = 1; index <= 4; index += 1) {
      await harness.repository.attachPhoto(visitId, creator.id, {
        url: `https://images.example.com/${index}.webp`,
        pathname: photoPath(`existente-${index}`),
        contentType: 'image/webp',
        sizeBytes: 100_000,
      });
    }
    const first = blob('concorrente-a-random');
    const second = blob('concorrente-b-random');

    const responses = await Promise.all([
      harness.POST(jsonRequest('POST', completedBody(first)), { params: Promise.resolve({ id: visitId }) }),
      harness.POST(jsonRequest('POST', completedBody(second)), { params: Promise.resolve({ id: visitId }) }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(harness.repository.photos.size).toBe(5);
    expect(harness.deleted).toHaveLength(1);
    expect([first.url, second.url]).toContain(harness.deleted[0]);
  });

  it('trata o replay do callback da quinta foto como sucesso sem apagar o Blob persistido', async () => {
    const harness = makeHarness();
    for (let index = 1; index <= 4; index += 1) {
      await harness.repository.attachPhoto(visitId, creator.id, {
        url: `https://images.example.com/${index}.webp`,
        pathname: photoPath(`replay-existente-${index}`),
        contentType: 'image/webp',
        sizeBytes: 100_000,
      });
    }
    const uploaded = blob('replay-da-quinta-random');
    const callback = completedBody(uploaded);

    const first = await harness.POST(jsonRequest('POST', callback), {
      params: Promise.resolve({ id: visitId }),
    });
    const replay = await harness.POST(jsonRequest('POST', callback), {
      params: Promise.resolve({ id: visitId }),
    });

    expect([first.status, replay.status]).toEqual([200, 200]);
    expect(harness.repository.photos.size).toBe(5);
    expect(harness.deleted).toEqual([]);
  });

  it('não mascara a falha original de persistência quando o cleanup também falha', async () => {
    const harness = makeHarness();
    for (let index = 1; index <= 5; index += 1) {
      await harness.repository.attachPhoto(visitId, creator.id, {
        url: `https://images.example.com/${index}.webp`,
        pathname: photoPath(`cheia-${index}`),
        contentType: 'image/webp',
        sizeBytes: 100_000,
      });
    }
    harness.dependencies.del = vi.fn().mockRejectedValue(new Error('Blob indisponível'));
    const handlers = createVisitPhotoRouteHandlers(async () => harness.dependencies);

    const response = await handlers.POST(
      jsonRequest('POST', completedBody(blob('sexta-random'))),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'A visita já possui o máximo de cinco fotos.',
    });
  });
});

describe('DELETE /api/visits/[id]/photos', () => {
  async function storedPhoto(harness: ReturnType<typeof makeHarness>, uploader = other) {
    await harness.repository.attachPhoto(visitId, uploader.id, {
      url: blob('armazenada-random').url,
      pathname: photoPath('armazenada-random'),
      contentType: 'image/webp',
      sizeBytes: 100_000,
    });
    return [...harness.repository.photos.values()][0];
  }

  it.each([
    ['criador', creator],
    ['administrador', admin],
  ])('permite que o %s remova pelo pathname confiável do repositório', async (_label, actor) => {
    const harness = makeHarness(actor);
    const photo = await storedPhoto(harness);

    const response = await harness.DELETE(
      jsonRequest('DELETE', { photoId: photo.id, pathname: 'visits/outra/foto.webp' }),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(204);
    expect(harness.deleted).toEqual([photo.pathname]);
    expect(harness.repository.photos.size).toBe(0);
  });

  it('rejeita membro alheio à visita sem apagar Blob nem metadado', async () => {
    const harness = makeHarness(other);
    const photo = await storedPhoto(harness, other);

    const response = await harness.DELETE(
      jsonRequest('DELETE', { photoId: photo.id }),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(403);
    expect(harness.deleted).toEqual([]);
    expect(harness.repository.photos.has(photo.id)).toBe(true);
  });

  it('torna a repetição idempotente sem reutilizar pathname enviado pelo cliente', async () => {
    const harness = makeHarness();
    const photo = await storedPhoto(harness);
    const body = { photoId: photo.id, pathname: 'visits/arbitraria/alvo.webp' };

    const first = await harness.DELETE(jsonRequest('DELETE', body), {
      params: Promise.resolve({ id: visitId }),
    });
    const retry = await harness.DELETE(jsonRequest('DELETE', body), {
      params: Promise.resolve({ id: visitId }),
    });

    expect([first.status, retry.status]).toEqual([204, 204]);
    expect(harness.deleted).toEqual([photo.pathname]);
  });

  it('mantém metadado para retry quando a remoção do Blob falha', async () => {
    const harness = makeHarness();
    const photo = await storedPhoto(harness);
    harness.dependencies.del = vi.fn().mockRejectedValue(new Error('Blob indisponível'));
    const handlers = createVisitPhotoRouteHandlers(async () => harness.dependencies);

    const response = await handlers.DELETE(
      jsonRequest('DELETE', { photoId: photo.id }),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(500);
    expect(harness.repository.photos.has(photo.id)).toBe(true);
  });

  it('considera Blob já ausente como sucesso e remove o metadado pendente', async () => {
    const harness = makeHarness();
    const photo = await storedPhoto(harness);
    const missing = new Error('Blob ausente');
    missing.name = 'BlobNotFoundError';
    harness.dependencies.del = vi.fn().mockRejectedValue(missing);
    const handlers = createVisitPhotoRouteHandlers(async () => harness.dependencies);

    const response = await handlers.DELETE(
      jsonRequest('DELETE', { photoId: photo.id }),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(204);
    expect(harness.repository.photos.size).toBe(0);
  });

  it('mantém o pathname no metadado para repetir após falha do banco posterior ao Blob', async () => {
    const harness = makeHarness();
    const photo = await storedPhoto(harness);
    harness.repository.deleteFailure = new Error('Banco temporariamente indisponível');

    const failed = await harness.DELETE(
      jsonRequest('DELETE', { photoId: photo.id }),
      { params: Promise.resolve({ id: visitId }) },
    );
    expect(failed.status).toBe(500);
    expect(harness.repository.photos.get(photo.id)?.pathname).toBe(photo.pathname);

    const retried = await harness.DELETE(
      jsonRequest('DELETE', { photoId: photo.id }),
      { params: Promise.resolve({ id: visitId }) },
    );
    expect(retried.status).toBe(204);
    expect(harness.repository.photos.has(photo.id)).toBe(false);
    expect(harness.deleted).toEqual([photo.pathname, photo.pathname]);
  });
});
