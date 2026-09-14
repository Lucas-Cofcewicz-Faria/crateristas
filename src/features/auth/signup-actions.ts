'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth/server';
import { requireAdmin, findOptionalMember } from '@/lib/auth/access';
import { beginEnrollment, finishEnrollment, readSharedInvite, changeSharedInvite, ENROLLMENT_COOKIE, ENROLLMENT_MAX_AGE } from './invite-repository';
import type { SignupState } from './signup-state';

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(128),
  token: z.string().min(1).max(200),
});

export async function signupAction(_previous: SignupState, data: FormData): Promise<SignupState> {
  const parsed = schema.safeParse(Object.fromEntries(['name', 'email', 'password', 'token'].map((key) => [key, data.get(key)])));
  if (!parsed.success) return { error: 'Informe seu nome, um e-mail válido e uma senha de 8 a 128 caracteres.', message: null };
  const { token, ...credentials } = parsed.data;
  let receipt: string;
  try {
    receipt = await beginEnrollment(token, credentials.email, credentials.name);
  } catch (error) {
    const message = error instanceof Error && (error.message.startsWith('Convite ') || error.message.startsWith('Não foi possível iniciar'))
      ? error.message : 'Não foi possível validar o convite agora. Tente novamente.';
    return { error: message, message: null };
  }
  const store = await cookies();
  store.set(ENROLLMENT_COOKIE, receipt, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ENROLLMENT_MAX_AGE });
  let completed = false;
  try {
    const result = await auth.signUp.email(credentials);
    if (result.error) return { error: 'Não foi possível criar a conta. Se já tem cadastro, entre com seu e-mail e senha para continuar.', message: null };
    const { data: session } = await auth.getSession();
    if (session?.user?.id && session.user.email.toLowerCase() === credentials.email) {
      completed = await finishEnrollment(receipt, session.user);
    }
  } catch {
    return { error: 'Não foi possível concluir agora. Tente entrar com o e-mail e a senha escolhidos para retomar o cadastro.', message: null };
  }
  if (completed) {
    store.delete(ENROLLMENT_COOKIE);
    revalidatePath('/home'); revalidatePath('/historia');
    redirect('/painel');
  }
  return { error: null, message: 'Conta criada. Se o Neon solicitar confirmação, confira seu e-mail. Depois entre com sua senha neste navegador para concluir o cadastro.' };
}

export async function completeSignupAction(_previous: SignupState): Promise<SignupState> {
  let completed = false;
  try {
    const store = await cookies();
    const receipt = store.get(ENROLLMENT_COOKIE)?.value;
    const { data } = await auth.getSession();
    if (!data?.user?.id) return { error: 'Entre com o e-mail e a senha escolhidos para concluir.', message: null };
    if (await findOptionalMember()) completed = true;
    else if (receipt) completed = await finishEnrollment(receipt, data.user);
    if (completed) store.delete(ENROLLMENT_COOKIE);
  } catch {
    return { error: 'Não foi possível concluir agora. Tente novamente em instantes.', message: null };
  }
  if (!completed) return { error: 'O comprovante de cadastro expirou ou o convite foi substituído. Abra o link atual do grupo para tentar novamente.', message: null };
  revalidatePath('/home'); revalidatePath('/historia');
  redirect('/painel');
}

export async function manageInviteAction(command: 'replace' | 'disable') {
  try {
    const admin = await requireAdmin();
    if (command !== 'replace' && command !== 'disable') throw new Error('Invalid command');
    await changeSharedInvite(admin.id, command);
    const invite = await readSharedInvite();
    revalidatePath('/painel');
    return { ...invite, error: null };
  } catch {
    return { active: false, token: null, error: 'Não foi possível alterar o convite. Verifique seu acesso de administrador e tente novamente.' };
  }
}
