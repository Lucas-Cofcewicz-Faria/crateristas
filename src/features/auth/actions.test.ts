import { beforeEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT_TEST:${path}`);
  }),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  signInEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: dependencies.cookies,
  headers: dependencies.headers,
}));
vi.mock('next/navigation', () => ({ redirect: dependencies.redirect }));
vi.mock('@/lib/auth/server', () => ({
  auth: {
    requestPasswordReset: dependencies.requestPasswordReset,
    resetPassword: dependencies.resetPassword,
    signIn: { email: dependencies.signInEmail },
    signOut: dependencies.signOut,
  },
}));

import * as authActions from './actions';

const { loginAction, logoutAction } = authActions;

function credentials(email: FormDataEntryValue, password: FormDataEntryValue) {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

function emailAddress(email: FormDataEntryValue) {
  const formData = new FormData();
  formData.set('email', email);
  return formData;
}

function newPassword(
  password: FormDataEntryValue,
  confirmation: FormDataEntryValue,
) {
  const formData = new FormData();
  formData.set('password', password);
  formData.set('passwordConfirmation', confirmation);
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

describe('requestPasswordResetAction', () => {
  beforeEach(() => {
    dependencies.headers.mockReset();
    dependencies.requestPasswordReset.mockReset();
    dependencies.headers.mockResolvedValue(new Headers({
      'x-forwarded-host': 'crateristas-git-develop-cofcewicz.vercel.app',
      'x-forwarded-proto': 'https',
    }));
  });

  it('rejeita um e-mail inválido antes de chamar o Neon Auth', async () => {
    const action = Reflect.get(authActions, 'requestPasswordResetAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;

    const result = await action(
      { status: 'idle', message: null },
      emailAddress('nao-e-email'),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Digite um e-mail válido.',
    });
    expect(dependencies.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('normaliza o e-mail e usa a origem da aplicação no link de retorno', async () => {
    const action = Reflect.get(authActions, 'requestPasswordResetAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;
    dependencies.requestPasswordReset.mockResolvedValue({
      data: { status: true, message: 'sent' },
      error: null,
    });

    const result = await action(
      { status: 'idle', message: null },
      emailAddress('  ANA@Example.COM  '),
    );

    expect(dependencies.requestPasswordReset).toHaveBeenCalledWith({
      email: 'ana@example.com',
      redirectTo: 'https://crateristas-git-develop-cofcewicz.vercel.app/redefinir-senha/callback',
    });
    expect(result).toEqual({
      status: 'sent',
      message: 'Se o e-mail estiver cadastrado, enviaremos um link para definir uma nova senha.',
    });
  });

  it('mantém a resposta genérica quando o provedor aceita um e-mail desconhecido', async () => {
    const action = Reflect.get(authActions, 'requestPasswordResetAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;
    dependencies.requestPasswordReset.mockResolvedValue({
      data: { status: true, message: 'If the email exists, the link was sent.' },
      error: null,
    });

    const result = await action(
      { status: 'idle', message: null },
      emailAddress('ana@example.com'),
    );

    expect(result).toEqual({
      status: 'sent',
      message: 'Se o e-mail estiver cadastrado, enviaremos um link para definir uma nova senha.',
    });
    expect(JSON.stringify(result)).not.toContain('ana@example.com');
    expect(JSON.stringify(result)).not.toContain('exists');
  });

  it('oferece nova tentativa quando o SDK resolve com erro operacional', async () => {
    const action = Reflect.get(authActions, 'requestPasswordResetAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;
    dependencies.requestPasswordReset.mockResolvedValue({
      data: null,
      error: {
        message: 'NEON_AUTH_BASE_URL indisponível',
        status: 503,
        code: 'NETWORK_ERROR',
      },
    });

    const result = await action(
      { status: 'idle', message: null },
      emailAddress('ana@example.com'),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'Não foi possível enviar o link agora. Tente novamente em instantes.',
    });
    expect(JSON.stringify(result)).not.toContain('NEON_AUTH');
  });
});

describe('resetPasswordAction', () => {
  beforeEach(() => {
    dependencies.cookieDelete.mockReset();
    dependencies.cookieGet.mockReset();
    dependencies.cookies.mockReset();
    dependencies.redirect.mockClear();
    dependencies.resetPassword.mockReset();
    dependencies.cookieGet.mockReturnValue({ value: 'token-valido' });
    dependencies.cookies.mockResolvedValue({
      delete: dependencies.cookieDelete,
      get: dependencies.cookieGet,
    });
  });

  it('rejeita um cookie de redefinição ausente antes de chamar o Neon Auth', async () => {
    const action = Reflect.get(authActions, 'resetPasswordAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;
    dependencies.cookieGet.mockReturnValue(undefined);

    const result = await action(
      { status: 'idle', message: null },
      newPassword('senha-segura', 'senha-segura'),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'O link de redefinição é inválido ou expirou.',
    });
    expect(dependencies.resetPassword).not.toHaveBeenCalled();
  });

  it.each([
    ['senha curta', 'curta', 'curta', 'A nova senha deve ter pelo menos 8 caracteres.'],
    ['senha longa', 'a'.repeat(129), 'a'.repeat(129), 'A nova senha deve ter no máximo 128 caracteres.'],
    ['confirmação diferente', 'senha-segura', 'outra-senha', 'As senhas não coincidem.'],
  ])('valida %s antes de chamar o Neon Auth', async (
    _case,
    password,
    confirmation,
    expectedMessage,
  ) => {
    const action = Reflect.get(authActions, 'resetPasswordAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;

    const result = await action(
      { status: 'idle', message: null },
      newPassword(password, confirmation),
    );

    expect(result).toEqual({ status: 'error', message: expectedMessage });
    expect(dependencies.resetPassword).not.toHaveBeenCalled();
  });

  it('redefine a senha e redireciona para a entrada com confirmação', async () => {
    const action = Reflect.get(authActions, 'resetPasswordAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;
    dependencies.resetPassword.mockResolvedValue({
      data: { status: true },
      error: null,
    });

    await expect(action(
      { status: 'idle', message: null },
      newPassword('senha-segura', 'senha-segura'),
    )).rejects.toThrow('NEXT_REDIRECT_TEST:/entrar?senha=definida');

    expect(dependencies.resetPassword).toHaveBeenCalledWith({
      newPassword: 'senha-segura',
      token: 'token-valido',
    });
    expect(dependencies.redirect).toHaveBeenCalledWith('/entrar?senha=definida');
    expect(dependencies.cookieDelete).toHaveBeenCalledWith(
      'crateristas.password-reset',
    );
  });

  it('devolve um erro genérico para token recusado pelo provedor', async () => {
    const action = Reflect.get(authActions, 'resetPasswordAction');
    expect(action).toBeTypeOf('function');
    if (typeof action !== 'function') return;
    dependencies.resetPassword.mockResolvedValue({
      data: null,
      error: { message: 'INVALID_TOKEN secret-token', status: 400 },
    });

    const result = await action(
      { status: 'idle', message: null },
      newPassword('senha-segura', 'senha-segura'),
    );

    expect(result).toEqual({
      status: 'error',
      message: 'O link de redefinição é inválido ou expirou.',
    });
    expect(dependencies.cookieDelete).toHaveBeenCalledWith(
      'crateristas.password-reset',
    );
    expect(JSON.stringify(result)).not.toContain('token-valido');
  });
});
