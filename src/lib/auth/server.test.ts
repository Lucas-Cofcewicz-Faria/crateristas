import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { createNeonAuthMock } = vi.hoisted(() => ({
  createNeonAuthMock: vi.fn(),
}));

vi.mock('@neondatabase/auth/next/server', () => ({
  createNeonAuth: createNeonAuthMock,
}));

const VALID_BASE_URL = 'https://exemplo.neonauth.example/neondb/auth';
const VALID_SECRET = '12345678901234567890123456789012';

async function loadServer() {
  return import('./server');
}

function useValidEnvironment() {
  vi.stubEnv('NEON_AUTH_BASE_URL', VALID_BASE_URL);
  vi.stubEnv('NEON_AUTH_COOKIE_SECRET', VALID_SECRET);
}

function createFakeAuth() {
  const handlers = {
    GET: vi.fn(async () => Response.json({ method: 'GET' })),
    POST: vi.fn(async () => Response.json({ method: 'POST' })),
    PUT: vi.fn(async () => Response.json({ method: 'PUT' })),
    DELETE: vi.fn(async () => Response.json({ method: 'DELETE' })),
    PATCH: vi.fn(async () => Response.json({ method: 'PATCH' })),
  };
  const signIn = {
    email: vi.fn(function (this: unknown, credentials: { email: string; password: string }) {
      expect(this).toBe(signIn);
      return Promise.resolve({ data: credentials, error: null });
    }),
  };
  const fakeAuth = {
    getSession: vi.fn(function (this: unknown) {
      expect(this).toBe(fakeAuth);
      return Promise.resolve({ data: { user: { id: 'membro-1' } }, error: null });
    }),
    requestPasswordReset: vi.fn(function (
      this: unknown,
      input: { email: string; redirectTo: string },
    ) {
      expect(this).toBe(fakeAuth);
      return Promise.resolve({ data: { status: true, input }, error: null });
    }),
    resetPassword: vi.fn(function (
      this: unknown,
      input: { newPassword: string; token: string },
    ) {
      expect(this).toBe(fakeAuth);
      return Promise.resolve({ data: { status: true, input }, error: null });
    }),
    signIn,
    signOut: vi.fn(function (this: unknown) {
      expect(this).toBe(fakeAuth);
      return Promise.resolve({ data: null, error: null });
    }),
    handler: vi.fn(function (this: unknown) {
      expect(this).toBe(fakeAuth);
      return handlers;
    }),
    middleware: vi.fn(function (this: unknown, config?: { loginUrl?: string }) {
      expect(this).toBe(fakeAuth);
      return vi.fn(async () => Response.json({ loginUrl: config?.loginUrl }));
    }),
  };

  return { fakeAuth, handlers };
}

describe('configuração do Neon Auth', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createNeonAuthMock.mockReset();
  });

  it('exige a URL base do Neon Auth', async () => {
    const { AuthConfigurationError, readNeonAuthConfig } = await loadServer();

    expect(() =>
      readNeonAuthConfig({
        NEON_AUTH_COOKIE_SECRET: 'segredo-com-pelo-menos-trinta-e-dois-caracteres',
      }),
    ).toThrow(AuthConfigurationError);
  });

  it('exige o segredo usado para assinar os cookies', async () => {
    const { AuthConfigurationError, readNeonAuthConfig } = await loadServer();

    expect(() =>
      readNeonAuthConfig({
        NEON_AUTH_BASE_URL: VALID_BASE_URL,
      }),
    ).toThrow(AuthConfigurationError);
  });

  it('rejeita um segredo com menos de 32 caracteres', async () => {
    const { AuthConfigurationError, readNeonAuthConfig } = await loadServer();

    expect(() =>
      readNeonAuthConfig({
        NEON_AUTH_BASE_URL: VALID_BASE_URL,
        NEON_AUTH_COOKIE_SECRET: 'segredo-curto',
      }),
    ).toThrow(AuthConfigurationError);
  });

  it('produz a configuração explícita exigida pelo SDK', async () => {
    const { readNeonAuthConfig } = await loadServer();

    expect(
      readNeonAuthConfig({
        NEON_AUTH_BASE_URL: VALID_BASE_URL,
        NEON_AUTH_COOKIE_SECRET: VALID_SECRET,
      }),
    ).toEqual({
      baseUrl: VALID_BASE_URL,
      cookies: { secret: VALID_SECRET },
    });
  });

  it('adia a criação do cliente até uma operação de runtime', async () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', '');
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', '');
    const { AuthConfigurationError, auth } = await loadServer();

    expect(() => auth.getSession()).toThrow(AuthConfigurationError);
    expect(createNeonAuthMock).not.toHaveBeenCalled();
  });

  it('cria um único cliente e preserva o binding de getSession', async () => {
    useValidEnvironment();
    const { fakeAuth } = createFakeAuth();
    createNeonAuthMock.mockReturnValue(fakeAuth);
    const { auth } = await loadServer();

    await expect(auth.getSession()).resolves.toEqual({
      data: { user: { id: 'membro-1' } },
      error: null,
    });
    await auth.getSession();

    expect(createNeonAuthMock).toHaveBeenCalledTimes(1);
    expect(createNeonAuthMock).toHaveBeenCalledWith({
      baseUrl: VALID_BASE_URL,
      cookies: { secret: VALID_SECRET },
    });
  });

  it('preserva o binding do método aninhado signIn.email', async () => {
    useValidEnvironment();
    const { fakeAuth } = createFakeAuth();
    createNeonAuthMock.mockReturnValue(fakeAuth);
    const { auth } = await loadServer();
    const credentials = { email: 'membro@example.com', password: 'senha-segura' };

    await expect(auth.signIn.email(credentials)).resolves.toEqual({
      data: credentials,
      error: null,
    });
  });

  it('delega os handlers apenas quando uma requisição chega', async () => {
    useValidEnvironment();
    const { fakeAuth, handlers } = createFakeAuth();
    createNeonAuthMock.mockReturnValue(fakeAuth);
    const { auth } = await loadServer();
    const handler = auth.handler();

    expect(createNeonAuthMock).not.toHaveBeenCalled();

    const response = await handler.GET(
      new Request('http://localhost/api/auth/get-session'),
      { params: Promise.resolve({ path: ['get-session'] }) },
    );

    await expect(response.json()).resolves.toEqual({ method: 'GET' });
    expect(handlers.GET).toHaveBeenCalledOnce();
    expect(createNeonAuthMock).toHaveBeenCalledOnce();
  });

  it('delega o middleware apenas quando uma requisição chega', async () => {
    useValidEnvironment();
    const { fakeAuth } = createFakeAuth();
    createNeonAuthMock.mockReturnValue(fakeAuth);
    const { auth } = await loadServer();
    const middleware = auth.middleware({ loginUrl: '/entrar' });

    expect(createNeonAuthMock).not.toHaveBeenCalled();

    const response = await middleware(new NextRequest('http://localhost/area-dos-membros'));

    await expect(response.json()).resolves.toEqual({ loginUrl: '/entrar' });
    expect(fakeAuth.middleware).toHaveBeenCalledWith({ loginUrl: '/entrar' });
    expect(createNeonAuthMock).toHaveBeenCalledOnce();
  });

  it('delega os dois passos da recuperação somente quando são usados', async () => {
    useValidEnvironment();
    const { fakeAuth } = createFakeAuth();
    createNeonAuthMock.mockReturnValue(fakeAuth);
    const { auth } = await loadServer();

    expect(createNeonAuthMock).not.toHaveBeenCalled();

    await auth.requestPasswordReset({
      email: 'ana@example.com',
      redirectTo: 'https://crateristas.example/redefinir-senha',
    });
    await auth.resetPassword({
      newPassword: 'senha-segura',
      token: 'token-valido',
    });

    expect(fakeAuth.requestPasswordReset).toHaveBeenCalledOnce();
    expect(fakeAuth.resetPassword).toHaveBeenCalledOnce();
    expect(createNeonAuthMock).toHaveBeenCalledOnce();
  });

  it('expõe somente os métodos usados pelo aplicativo', async () => {
    const { auth } = await loadServer();

    expect(Object.keys(auth.signUp)).toEqual(['email']);
    expect(Object.keys(auth).sort()).toEqual(
      [
        'getSession',
        'handler',
        'middleware',
        'requestPasswordReset',
        'resetPassword',
        'signIn',
        'signOut',
        'signUp',
      ].sort(),
    );
  });
});
