'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { PASSWORD_RESET_COOKIE } from '@/lib/auth/password-reset';
import {
  LOGIN_ERROR_MESSAGE,
  type LoginAction,
  type LoginState,
  PASSWORD_RESET_INVALID_LINK_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_RESET_REQUEST_ERROR_MESSAGE,
  PASSWORD_RESET_SENT_MESSAGE,
  type PasswordResetAction,
  type PasswordResetState,
} from './auth-state';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const emailSchema = z.email();

async function getAuth() {
  return (await import('@/lib/auth/server')).auth;
}

function invalidCredentials(): LoginState {
  return { error: LOGIN_ERROR_MESSAGE };
}

function resetState(
  status: PasswordResetState['status'],
  message: string,
): PasswordResetState {
  return { status, message };
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

async function getApplicationOrigin(): Promise<string> {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelHost = process.env.VERCEL_BRANCH_URL?.trim()
    || process.env.VERCEL_URL?.trim();
  const headerStore = await headers();
  const forwardedHost = firstHeaderValue(headerStore.get('x-forwarded-host'));
  const host = forwardedHost || firstHeaderValue(headerStore.get('host'));
  const forwardedProtocol = firstHeaderValue(headerStore.get('x-forwarded-proto'));
  const candidate = configuredUrl
    || (vercelHost ? `https://${vercelHost}` : null)
    || (host ? `${forwardedProtocol || (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : null);

  if (!candidate) throw new Error('Origem da aplicação indisponível.');

  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Origem da aplicação inválida.');
  }

  return url.origin;
}

export const loginAction: LoginAction = async (_previousState, formData) => {
  const rawEmail = formData.get('email');
  const rawPassword = formData.get('password');
  const parsed = loginSchema.safeParse({
    email: typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail,
    password: rawPassword,
  });

  if (!parsed.success) return invalidCredentials();

  let rejected = false;
  try {
    const auth = await getAuth();
    const result = await auth.signIn.email(parsed.data);
    rejected = Boolean(result.error);
  } catch {
    return invalidCredentials();
  }

  if (rejected) return invalidCredentials();

  redirect('/painel');
};

export async function logoutAction(): Promise<void> {
  let rejected = false;
  try {
    const auth = await getAuth();
    const result = await auth.signOut();
    rejected = Boolean(result.error);
  } catch {
    throw new Error('Não foi possível encerrar a sessão.');
  }

  if (rejected) throw new Error('Não foi possível encerrar a sessão.');

  redirect('/registros');
}

export const requestPasswordResetAction: PasswordResetAction = async (
  _previousState,
  formData,
) => {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string'
    ? rawEmail.trim().toLowerCase()
    : rawEmail;
  const parsed = emailSchema.safeParse(email);

  if (!parsed.success) {
    return resetState('error', 'Digite um e-mail válido.');
  }

  try {
    const auth = await getAuth();
    const origin = await getApplicationOrigin();
    const result = await auth.requestPasswordReset({
      email: parsed.data,
      redirectTo: `${origin}/redefinir-senha/callback`,
    });
    if (result.error) {
      return resetState('error', PASSWORD_RESET_REQUEST_ERROR_MESSAGE);
    }
  } catch {
    return resetState('error', PASSWORD_RESET_REQUEST_ERROR_MESSAGE);
  }

  // A resposta é deliberadamente idêntica para e-mails cadastrados ou não.
  return resetState('sent', PASSWORD_RESET_SENT_MESSAGE);
};

export const resetPasswordAction: PasswordResetAction = async (
  _previousState,
  formData,
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(PASSWORD_RESET_COOKIE)?.value;
  const password = formData.get('password');
  const confirmation = formData.get('passwordConfirmation');

  if (!token) {
    return resetState('error', PASSWORD_RESET_INVALID_LINK_MESSAGE);
  }

  if (typeof password !== 'string' || password.length < 8) {
    return resetState('error', 'A nova senha deve ter pelo menos 8 caracteres.');
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return resetState('error', 'A nova senha deve ter no máximo 128 caracteres.');
  }

  if (typeof confirmation !== 'string' || password !== confirmation) {
    return resetState('error', 'As senhas não coincidem.');
  }

  let rejected = false;
  try {
    const auth = await getAuth();
    const result = await auth.resetPassword({ newPassword: password, token });
    rejected = Boolean(result.error);
  } catch {
    return resetState('error', PASSWORD_RESET_INVALID_LINK_MESSAGE);
  }

  if (rejected) {
    cookieStore.delete(PASSWORD_RESET_COOKIE);
    return resetState('error', PASSWORD_RESET_INVALID_LINK_MESSAGE);
  }

  cookieStore.delete(PASSWORD_RESET_COOKIE);
  redirect('/entrar?senha=definida');
};
