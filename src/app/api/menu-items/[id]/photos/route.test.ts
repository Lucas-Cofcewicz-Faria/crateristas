// @vitest-environment node
import type { PutBlobResult } from '@vercel/blob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMenuPhotoRouteHandlers, type MenuPhotoRouteDependencies } from './route';

const itemId = '9e8c0a61-88aa-4a3e-998f-f822b7be1273';
const actorId = '8f43684a-5c3a-4f0f-b0b1-963fa5e57aa6';
const photoId = 'bf8162ee-b3f2-429f-827f-9667369f8c57';
const pathname = `menu-items/${itemId}/${photoId}.webp`;
const uploaded: PutBlobResult = {
  url: `https://arquivos.public.blob.vercel-storage.com/${pathname}`,
  downloadUrl: `https://arquivos.public.blob.vercel-storage.com/${pathname}?download=1`,
  pathname,
  contentType: 'image/webp',
  contentDisposition: 'inline',
  etag: 'etag-1',
};

function request(file = new File(['RIFF....WEBPVP8 '], 'prato.webp', { type: 'image/webp' }), origin = 'https://crateristas.test') {
  const form = new FormData();
  form.set('photo', file);
  return new Request(`https://crateristas.test/api/menu-items/${itemId}/photos`, {
    method: 'POST',
    headers: { origin },
    body: form,
  });
}

function harness(overrides: Partial<MenuPhotoRouteDependencies> = {}) {
  const dependencies: MenuPhotoRouteDependencies = {
    requireMember: vi.fn().mockResolvedValue({ id: actorId }),
    canManageMenuPhotos: vi.fn().mockResolvedValue(true),
    attachMenuPhoto: vi.fn().mockResolvedValue(true),
    put: vi.fn().mockResolvedValue(uploaded),
    del: vi.fn().mockResolvedValue(undefined),
    randomUUID: vi.fn().mockReturnValue(photoId),
    ...overrides,
  };
  return { dependencies, ...createMenuPhotoRouteHandlers(async () => dependencies) };
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/menu-items/[id]/photos', () => {
  it('recusa origem cruzada antes de autenticar ou tocar no Blob', async () => {
    const route = harness();
    const response = await route.POST(request(undefined, 'https://atacante.test'), {
      params: Promise.resolve({ id: itemId }),
    });

    expect(response.status).toBe(403);
    expect(route.dependencies.requireMember).not.toHaveBeenCalled();
    expect(route.dependencies.put).not.toHaveBeenCalled();
  });

  it('autoriza somente criador ou admin antes de enviar bytes ao Blob', async () => {
    const route = harness({ canManageMenuPhotos: vi.fn().mockResolvedValue(false) });
    const response = await route.POST(request(), { params: Promise.resolve({ id: itemId }) });

    expect(response.status).toBe(403);
    expect(route.dependencies.canManageMenuPhotos).toHaveBeenCalledWith(actorId, itemId);
    expect(route.dependencies.put).not.toHaveBeenCalled();
    expect(route.dependencies.attachMenuPhoto).not.toHaveBeenCalled();
  });

  it.each([
    ['tipo diferente de WebP', new File(['png'], 'prato.png', { type: 'image/png' })],
    ['arquivo vazio', new File([], 'prato.webp', { type: 'image/webp' })],
    ['conteúdo falso com tipo WebP', new File(['not an image'], 'prato.webp', { type: 'image/webp' })],
    ['arquivo acima de 750 KB', new File([new Uint8Array(750_001)], 'prato.webp', { type: 'image/webp' })],
  ])('recusa %s sem criar Blob', async (_label, file) => {
    const route = harness();
    const response = await route.POST(request(file), { params: Promise.resolve({ id: itemId }) });

    expect(response.status).toBe(400);
    expect(route.dependencies.put).not.toHaveBeenCalled();
  });

  it('salva WebP com pathname UUID e anexa somente depois do upload', async () => {
    const route = harness();
    const source = new File(['RIFF....WEBPVP8 '], 'prato.webp', { type: 'image/webp' });
    const response = await route.POST(request(source), { params: Promise.resolve({ id: itemId }) });

    expect(response.status).toBe(201);
    expect(route.dependencies.put).toHaveBeenCalledWith(pathname, expect.any(File), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'image/webp',
    });
    expect(route.dependencies.attachMenuPhoto).toHaveBeenCalledWith(actorId, itemId, uploaded.url, uploaded.pathname);
    await expect(response.json()).resolves.toEqual({
      photo: { url: uploaded.url, pathname: uploaded.pathname },
    });
  });

  it('remove o Blob novo quando o quinto espaço já foi tomado antes do attach', async () => {
    const route = harness({ attachMenuPhoto: vi.fn().mockResolvedValue(false) });
    const response = await route.POST(request(), { params: Promise.resolve({ id: itemId }) });

    expect(response.status).toBe(409);
    expect(route.dependencies.del).toHaveBeenCalledWith(uploaded.pathname);
    await expect(response.json()).resolves.toEqual({ error: 'O item já possui o máximo de cinco fotos.' });
  });

  it('tenta limpar o Blob sem mascarar a falha original de persistência', async () => {
    const route = harness({
      attachMenuPhoto: vi.fn().mockRejectedValue(new Error('banco indisponível')),
      del: vi.fn().mockRejectedValue(new Error('blob indisponível')),
    });
    const response = await route.POST(request(), { params: Promise.resolve({ id: itemId }) });

    expect(response.status).toBe(500);
    expect(route.dependencies.del).toHaveBeenCalledWith(uploaded.pathname);
    await expect(response.json()).resolves.toEqual({ error: 'Não foi possível enviar a foto.' });
  });

  it('traduz sessão ausente e identificador inválido sem expor detalhes internos', async () => {
    const authError = new Error('cookie secreto');
    authError.name = 'AuthenticationError';
    const unauthenticated = harness({ requireMember: vi.fn().mockRejectedValue(authError) });
    const authResponse = await unauthenticated.POST(request(), { params: Promise.resolve({ id: itemId }) });
    expect(authResponse.status).toBe(401);
    await expect(authResponse.json()).resolves.toEqual({ error: 'Sessão expirada. Entre novamente.' });

    const invalid = harness();
    const invalidResponse = await invalid.POST(request(), { params: Promise.resolve({ id: 'não-é-uuid' }) });
    expect(invalidResponse.status).toBe(400);
    expect(invalid.dependencies.requireMember).not.toHaveBeenCalled();
  });
});
