'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  LOGIN_ERROR_MESSAGE,
  type LoginAction,
  type LoginState,
} from './auth-state';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

async function getAuth() {
  return (await import('@/lib/auth/server')).auth;
}

function invalidCredentials(): LoginState {
  return { error: LOGIN_ERROR_MESSAGE };
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
