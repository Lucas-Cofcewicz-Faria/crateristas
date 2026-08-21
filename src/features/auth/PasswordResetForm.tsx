'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import {
  initialPasswordResetState,
  PASSWORD_MAX_LENGTH,
  type PasswordResetAction,
} from './auth-state';
import styles from './auth.module.css';

export interface PasswordResetFormProps {
  action: PasswordResetAction;
}

export function PasswordResetForm({ action }: PasswordResetFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialPasswordResetState,
  );

  return (
    <form action={formAction} className={styles.form}>
      <Field
        autoComplete="new-password"
        description="Use pelo menos 8 caracteres."
        id="new-password"
        label="Nova senha"
        maxLength={PASSWORD_MAX_LENGTH}
        minLength={8}
        name="password"
        required
        type="password"
      />
      <Field
        autoComplete="new-password"
        id="new-password-confirmation"
        label="Confirme a nova senha"
        maxLength={PASSWORD_MAX_LENGTH}
        minLength={8}
        name="passwordConfirmation"
        required
        type="password"
      />
      {state.message ? (
        <p aria-live="polite" className={styles.formError} role="alert">
          {state.message}
        </p>
      ) : null}
      <Button disabled={isPending} fullWidth type="submit">
        {isPending ? 'Salvando...' : 'Definir nova senha'}
      </Button>
    </form>
  );
}
