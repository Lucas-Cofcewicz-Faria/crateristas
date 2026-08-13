'use client';

import { useState } from 'react';
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
  initialState: PublicationState;
}

export function AdminPublicationControls({
  visitId,
  isAdmin,
  participantCount,
  initialState,
}: AdminPublicationControlsProps) {
  const [state, setState] = useState(initialState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin || (state === 'private' && participantCount < 1)) return null;
  const action = ACTIONS[state];

  async function confirmAction() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await changePublication(visitId, action.command);
      setState(result.publicationState);
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
      <Button onClick={() => {
        setError(null);
        setDialogOpen(true);
      }} variant={action.variant}>
        {action.label}
      </Button>

      {dialogOpen ? (
        <dialog
          aria-describedby="publication-dialog-description"
          aria-labelledby="publication-dialog-title"
          aria-modal="true"
          className={styles.dialogBackdrop}
          onCancel={(event) => {
            event.preventDefault();
            if (!pending) setDialogOpen(false);
          }}
          open
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
      ) : null}
    </section>
  );
}
