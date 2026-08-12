import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    handler: () => ({
      GET: async (_request: Request, context: { params: Promise<{ path: string[] }> }) =>
        Response.json({ method: 'GET', path: (await context.params).path }),
      POST: async (_request: Request, context: { params: Promise<{ path: string[] }> }) =>
        Response.json({ method: 'POST', path: (await context.params).path }),
    }),
  },
}));

import { GET, POST } from './route';

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function request(method: 'GET' | 'POST', path: string) {
  return new Request(`http://localhost/api/auth/${path}`, { method });
}

describe('handler fechado do Neon Auth', () => {
  it.each([
    [['sign-up', 'email'], 'sign-up/email'],
    [['sign-up/email'], 'sign-up%2Femail'],
    [['sign-up%2Femail'], 'sign-up%252Femail'],
    [['sign-up%252Femail'], 'sign-up%25252Femail'],
  ])('bloqueia cadastro com caminho alternativo %#', async (path, urlPath) => {
    const response = await POST(request('POST', urlPath), context(path));

    expect(response.status).toBe(404);
  });

  it.each([
    ['sign-in/social', ['sign-in', 'social']],
    ['sign-in/magic-link', ['sign-in', 'magic-link']],
    ['sign-in/email-otp', ['sign-in', 'email-otp']],
    ['admin/create-user', ['admin', 'create-user']],
    ['token/anonymous', ['token', 'anonymous']],
    ['organization/create', ['organization', 'create']],
    ['phone-number/verify', ['phone-number', 'verify']],
    ['update-user', ['update-user']],
    ['delete-user', ['delete-user']],
  ])('bloqueia fluxo que pode ampliar a superfície de contas: %s', async (urlPath, path) => {
    const response = await POST(request('POST', urlPath), context(path));

    expect(response.status).toBe(404);
  });

  it.each([
    'sign-in/email',
    'sign-out',
    'revoke-session',
    'revoke-sessions',
    'revoke-all-sessions',
    'refresh-token',
    'change-password',
    'send-verification-email',
    'verify-email',
    'reset-password',
    'request-password-reset',
  ])('encaminha POST necessário ao fluxo fechado: %s', async (canonicalPath) => {
    const path = canonicalPath.split('/');
    const response = await POST(request('POST', canonicalPath), context(path));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ method: 'POST', path });
  });

  it.each([
    'get-session',
    'get-access-token',
    'list-sessions',
    'token',
    'jwt',
  ])('encaminha GET de sessão ou token permitido: %s', async (canonicalPath) => {
    const path = canonicalPath.split('/');
    const response = await GET(request('GET', canonicalPath), context(path));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ method: 'GET', path });
  });

  it.each([
    ['GET', 'sign-in/email', ['sign-in', 'email']],
    ['POST', 'get-session', ['get-session']],
    ['GET', 'token/anonymous', ['token', 'anonymous']],
    ['GET', 'list-accounts', ['list-accounts']],
    ['GET', 'account-info', ['account-info']],
    ['POST', 'rota-desconhecida', ['rota-desconhecida']],
  ] as const)('bloqueia combinação fora da allowlist: %s %s', async (method, urlPath, path) => {
    const response =
      method === 'GET'
        ? await GET(request(method, urlPath), context([...path]))
        : await POST(request(method, urlPath), context([...path]));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ erro: 'Rota de autenticação indisponível.' });
  });
});
