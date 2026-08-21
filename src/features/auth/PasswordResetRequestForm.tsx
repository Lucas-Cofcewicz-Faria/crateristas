'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import {
  initialPasswordResetState,
  type PasswordResetAction,
} from './auth-state';
import styles from './auth.module.css';

export interface PasswordResetRequestFormProps {
  action: PasswordResetAction;
}

export function PasswordResetRequestForm(
  { action }: PasswordResetRequestFormProps,
) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialPasswordResetState,
  );

  return (
    <form action={formAction} className={styles.form}>
      <Field
        autoComplete="email"
        id="password-reset-email"
        label="E-mail"
        name="email"
        required
        type="email"
      />
      {state.message ? (
        <p
          aria-live="polite"
          className={state.status === 'sent' ? styles.formSuccess : styles.formError}
          role={state.status === 'sent' ? 'status' : 'alert'}
        >
          {state.message}
        </p>
      ) : null}
      <Button disabled={isPending} fullWidth type="submit">
        {isPending ? 'Enviando...' : 'Enviar link'}
      </Button>
      <Link className={styles.textLink} href="/entrar">
        Voltar para a entrada
      </Link>
    </form>
  );
}
