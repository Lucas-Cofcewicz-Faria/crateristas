'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { signupAction, completeSignupAction } from './signup-actions';
import { initialSignupState } from './signup-state';
import styles from './auth.module.css';

export function SignupForm({ token, completing = false }: { token?: string; completing?: boolean }) {
  const [state, action, pending] = useActionState(completing ? completeSignupAction : signupAction, initialSignupState);
  return (
    <form action={action} className={styles.form}>
      {!completing && !state.message ? <>
        <input name="token" type="hidden" value={token ?? ''} />
        <Field id="signup-name" label="Nome do craterista" name="name" autoComplete="nickname" required maxLength={80} />
        <Field id="signup-email" label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field id="signup-password" label="Senha" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
        <p>Use pelo menos 8 caracteres. Seu nome aparecerá no diretório público e nas avaliações.</p>
      </> : null}
      {state.error ? <p className={styles.formError} role="alert">{state.error}</p> : null}
      {state.message ? <p className={styles.formSuccess} role="status">{state.message}</p> : (
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? 'Concluindo...' : completing ? 'Concluir cadastro' : 'Fazer parte da sociedade'}
          <ArrowUpRight aria-hidden="true" size={20} />
        </Button>
      )}
      <Link href="/entrar" className={styles.textLink}>Já tenho conta — entrar</Link>
    </form>
  );
}
