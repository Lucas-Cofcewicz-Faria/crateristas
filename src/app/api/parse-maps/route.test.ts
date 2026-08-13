import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GoogleMapsExtractionError,
  GoogleMapsInputError,
  GoogleMapsUpstreamError,
} from '@/features/visits/google-maps-import';
const dependencies = vi.hoisted(() => ({
  AuthenticationError: class AuthenticationError extends Error {
    constructor() {
      super('Não autenticado');
      this.name = 'AuthenticationError';
    }
  },
  requireMember: vi.fn(),
  importSuggestions: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({ requireMember: dependencies.requireMember }));

import { createGoogleMapsRoute } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.requireMember.mockResolvedValue({ id: 'member-1' });
  dependencies.importSuggestions.mockResolvedValue({ name: 'Mesa Segura' });
});

describe('POST /api/parse-maps', () => {
  it('autentica antes de ler o body ou iniciar qualquer fetch/importação', async () => {
    dependencies.requireMember.mockRejectedValue(new dependencies.AuthenticationError());
    const json = vi.fn();
    const route = createGoogleMapsRoute(dependencies);

    const response = await route({ json } as unknown as Request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Sessão expirada. Entre novamente.',
    });
    expect(json).not.toHaveBeenCalled();
    expect(dependencies.importSuggestions).not.toHaveBeenCalled();
  });

  it('aceita somente { url } e retorna a allowlist estreita', async () => {
    dependencies.importSuggestions.mockResolvedValue({
      name: '<strong>Mesa Segura</strong>',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: 'Rua Um, 8',
      image: 'https://evil.test/image.jpg',
      resolvedUrl: 'https://www.google.com/maps/place/Mesa',
      html: '<secret>',
    });
    const route = createGoogleMapsRoute(dependencies);
    const response = await route(new Request('http://localhost/api/parse-maps', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.google.com/maps/place/Mesa' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      name: 'Mesa Segura',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: 'Rua Um, 8',
    });
  });

  it.each([
    [new GoogleMapsInputError(), 400, 'Revise o link do Google Maps.'],
    [new GoogleMapsExtractionError(), 422, 'Não foi possível identificar os dados desse link.'],
    [new GoogleMapsUpstreamError(), 502, 'Não foi possível consultar o Google Maps agora.'],
    [new Error('token=segredo'), 502, 'Não foi possível consultar o Google Maps agora.'],
  ])('mapeia falhas sem detalhes internos', async (error, status, message) => {
    dependencies.importSuggestions.mockRejectedValue(error);
    const route = createGoogleMapsRoute(dependencies);
    const response = await route(new Request('http://localhost/api/parse-maps', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.google.com/maps/place/Mesa' }),
    }));

    expect(response.status).toBe(status);
    const payload = await response.json();
    expect(payload).toEqual({ error: message });
    expect(JSON.stringify(payload)).not.toContain('segredo');
  });

  it('rejeita JSON/corpo inválido com 400 depois da autenticação', async () => {
    const route = createGoogleMapsRoute(dependencies);
    const response = await route(new Request('http://localhost/api/parse-maps', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.google.com/maps/place/Mesa', extra: true }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Revise o link do Google Maps.' });
    expect(dependencies.requireMember).toHaveBeenCalledOnce();
    expect(dependencies.importSuggestions).not.toHaveBeenCalled();
  });
});
