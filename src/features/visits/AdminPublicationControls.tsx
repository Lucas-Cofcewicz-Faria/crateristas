'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CRATERISTAS_GROUP_SIZE, type PublicationState } from '@/domain/reviews/types';
import {
  changePublication,
  type AdminPublicationCommand,
} from './visit-api';
import styles from './review-workflow.module.css';

interface ActionPresentation {
  command: AdminPublicationCommand;
  label: string;
  dialogTitle: string;
  confirmLabel: string;
  description: string;
  variant: 'primary' | 'danger' | 'secondary';
}

const ACTIONS: Record<PublicationState, ActionPresentation> = {
  private: {
    command: 'publish_early',
    label: 'Publicar antecipadamente',
    dialogTitle: 'Confirmar publicação antecipada',
    confirmLabel: 'Confirmar publicação',
    description: 'O registro ficará visível no arquivo público antes do quórum.',
    variant: 'primary',
  },
  published: {
    command: 'hide',
    label: 'Ocultar',
    dialogTitle: 'Confirmar ocultação',
    confirmLabel: 'Confirmar ocultação',
    description: 'O registro deixará de aparecer no arquivo público.',
    variant: 'danger',
  },
  hidden: {
    command: 'republish',
    label: 'Republicar',
    dialogTitle: 'Confirmar republicação',
    confirmLabel: 'Confirmar republicação',
    description: 'O registro voltará a aparecer no arquivo público.',
    variant: 'secondary',
  },
};

export interface AdminPublicationControlsProps {
  visitId: string;
  isAdmin: boolean;
  participantCount: number;
  publicationState: PublicationState;
  onChanged(result: Awaited<ReturnType<typeof changePublication>>): void;
}

export function AdminPublicationControls({
  visitId,
  isAdmin,
  participantCount,
  publicationState,
  onChanged,
}: AdminPublicationControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen) {
      if (!dialog.open) dialog.showModal();
      cancelButtonRef.current?.focus();
      return;
    }
    if (dialog.open) dialog.close();
    const previousFocus = previousFocusRef.current;
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocusRef.current = null;
  }, [dialogOpen]);

  if (!isAdmin || (publicationState === 'private' && participantCount < 1)) return null;
  const action = ACTIONS[publicationState];

  async function confirmAction() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await changePublication(visitId, action.command);
      onChanged(result);
      setDialogOpen(false);
    } catch {
      setError('Não foi possível alterar a publicação. Tente novamente.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.adminSection} aria-labelledby="admin-publication-title">
      <div>
        <p className={styles.eyebrow}>Administração</p>
        <h2 id="admin-publication-title">Estado do registro</h2>
        <p>As regras finais de publicação são validadas novamente pelo servidor.</p>
      </div>
      <Button onClick={(event) => {
        setError(null);
        previousFocusRef.current = event.currentTarget;
        setDialogOpen(true);
      }} variant={action.variant}>
        {action.label}
      </Button>

      <dialog
        aria-describedby="publication-dialog-description"
        aria-labelledby="publication-dialog-title"
        className={styles.dialogBackdrop}
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) setDialogOpen(false);
        }}
        ref={dialogRef}
      >
        <div className={styles.confirmDialog}>
          <h3 id="publication-dialog-title">{action.dialogTitle}</h3>
          <p id="publication-dialog-description">{action.description}</p>
          {action.command === 'publish_early' ? (
            <div className={styles.partialNotice}>
              <strong>
                {participantCount} de {CRATERISTAS_GROUP_SIZE} membros{' '}
                {participantCount === 1 ? 'contribuiu' : 'contribuíram'}
              </strong>
              <p>A média ainda é parcial.</p>
            </div>
          ) : null}
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          <div className={styles.dialogActions}>
            <Button
              disabled={pending}
              onClick={() => setDialogOpen(false)}
              ref={cancelButtonRef}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button disabled={pending} onClick={confirmAction} variant={action.variant}>
              {pending ? 'Confirmando...' : action.confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
