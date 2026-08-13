import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT_TEST:${path}`);
  }),
  signInEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: dependencies.redirect }));
vi.mock('@/lib/auth/server', () => ({
  auth: {
    signIn: { email: dependencies.signInEmail },
    signOut: dependencies.signOut,
  },
}));

import { loginAction, logoutAction } from './actions';

function credentials(email: FormDataEntryValue, password: FormDataEntryValue) {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

describe('loginAction', () => {
  beforeEach(() => {
    dependencies.redirect.mockClear();
    dependencies.signInEmail.mockReset();
  });

  it.each([
    ['', 'senha-valida'],
    ['nao-e-email', 'senha-valida'],
    ['ana@example.com', ''],
  ])('rejeita FormData inválido antes de chamar o Neon Auth', async (email, password) => {
    const result = await loginAction(
      { error: null },
      credentials(email, password),
    );

    expect(result).toEqual({ error: 'E-mail ou senha inválidos.' });
    expect(dependencies.signInEmail).not.toHaveBeenCalled();
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });

  it('normaliza somente o e-mail e redireciona depois do login aceito', async () => {
    dependencies.signInEmail.mockResolvedValue({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    });

    await expect(loginAction(
      { error: 'E-mail ou senha inválidos.' },
      credentials('  ANA@Example.COM  ', ' Senha-Nao-Normalizada '),
    )).rejects.toThrow('NEXT_REDIRECT_TEST:/painel');

    expect(dependencies.signInEmail).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: ' Senha-Nao-Normalizada ',
    });
    expect(dependencies.redirect).toHaveBeenCalledWith('/painel');
    expect(dependencies.signInEmail.mock.invocationCallOrder[0])
      .toBeLessThan(dependencies.redirect.mock.invocationCallOrder[0]);
  });

  it.each([
    ['retorno de credencial', async () => ({
      data: null,
      error: {
        message: 'Invalid password for secret Senha-privada-123!',
        status: 401,
        statusText: 'Unauthorized',
        code: 'INVALID_EMAIL_OR_PASSWORD',
      },
    })],
    ['falha de configuração/rede', async () => {
      throw new Error('NEON_AUTH_COOKIE_SECRET e Senha-privada-123!');
    }],
  ])('devolve somente o erro genérico no %s', async (_case, implementation) => {
    dependencies.signInEmail.mockImplementation(implementation);

    const result = await loginAction(
      { error: null },
      credentials('ana@example.com', 'Senha-privada-123!'),
    );

    expect(result).toEqual({ error: 'E-mail ou senha inválidos.' });
    expect(JSON.stringify(result)).not.toContain('Senha-privada-123!');
    expect(JSON.stringify(result)).not.toContain('NEON_AUTH');
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });
});

describe('logoutAction', () => {
  beforeEach(() => {
    dependencies.redirect.mockClear();
    dependencies.signOut.mockReset();
  });

  it('encerra a sessão antes de redirecionar para o arquivo público', async () => {
    dependencies.signOut.mockResolvedValue({ data: { success: true }, error: null });

    await expect(logoutAction()).rejects.toThrow(
      'NEXT_REDIRECT_TEST:/registros',
    );

    expect(dependencies.signOut).toHaveBeenCalledOnce();
    expect(dependencies.redirect).toHaveBeenCalledWith('/registros');
    expect(dependencies.signOut.mock.invocationCallOrder[0])
      .toBeLessThan(dependencies.redirect.mock.invocationCallOrder[0]);
  });

  it.each([
    ['retorno de erro', async () => ({
      data: null,
      error: {
        message: 'Upstream indisponível',
        status: 502,
        statusText: 'Bad Gateway',
        code: 'NETWORK_ERROR',
      },
    })],
    ['exceção do SDK', async () => {
      throw new Error('Falha interna do Neon Auth');
    }],
  ])('não redireciona quando signOut termina com %s', async (_case, implementation) => {
    dependencies.signOut.mockImplementation(implementation);

    await expect(logoutAction()).rejects.toThrow(
      'Não foi possível encerrar a sessão.',
    );
    expect(dependencies.redirect).not.toHaveBeenCalled();
  });
});
