'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { initialLoginState, type LoginAction } from './auth-state';
import styles from './auth.module.css';

export interface LoginFormProps {
  action: LoginAction;
}

export function LoginForm({ action }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialLoginState);

  return (
    <form action={formAction} className={styles.form}>
      <Field
        autoComplete="email"
        id="login-email"
        label="E-mail"
        name="email"
        required
        type="email"
      />
      <Field
        autoComplete="current-password"
        id="login-password"
        label="Senha"
        name="password"
        required
        type="password"
      />
      {state.error ? (
        <p aria-live="polite" className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}
      <Button disabled={isPending} fullWidth type="submit">
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
