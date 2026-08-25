'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { VISIT_DELETION_CONFIRMATION } from '@/domain/reviews/deletion';
import { VisitDeletionOutdatedError, deleteVisit } from './visit-api';
import { formatEvaluationCount } from './visit-formatters';
import styles from './review-workflow.module.css';

export interface AdminVisitDeletionProps {
  isAdmin: boolean;
  participantCount: number;
  restaurantName: string;
  visitId: string;
}

export function AdminVisitDeletion({
  isAdmin,
  participantCount,
  restaurantName,
  visitId,
}: AdminVisitDeletionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
    const previousFocus = previousFocusRef.current;
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocusRef.current = null;
  }, [dialogOpen]);

  if (!isAdmin) return null;

  function closeDialog() {
    if (pending) return;
    setDialogOpen(false);
    setConfirmation('');
    setError(null);
  }

  async function confirmDeletion() {
    if (pending || confirmation !== VISIT_DELETION_CONFIRMATION) return;
    setPending(true);
    setError(null);
    try {
      await deleteVisit(visitId, VISIT_DELETION_CONFIRMATION, participantCount);
      router.push('/painel');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof VisitDeletionOutdatedError
        ? 'A quantidade de avaliações mudou. Recarregue a página antes de excluir.'
        : 'Não foi possível excluir a review. Tente novamente.');
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="admin-deletion-title"
      className={styles.deletionSection}
    >
      <div>
        <h2 id="admin-deletion-title">Excluir review</h2>
        <p>
          {formatEvaluationCount(participantCount)} {participantCount === 1 ? 'será apagada' : 'serão apagadas'},
          junto com comentários, fotos e o registro público.
        </p>
      </div>
      <Button
        onClick={(event) => {
          previousFocusRef.current = event.currentTarget;
          setConfirmation('');
          setError(null);
          setDialogOpen(true);
        }}
        variant="danger"
      >
        Excluir review permanentemente
      </Button>

      <dialog
        aria-describedby="deletion-dialog-description"
        aria-labelledby="deletion-dialog-title"
        className={styles.dialogBackdrop}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        ref={dialogRef}
      >
        <div className={styles.confirmDialog}>
          <h3 id="deletion-dialog-title">Excluir review de {restaurantName}?</h3>
          <p id="deletion-dialog-description">
            Esta ação é permanente e remove o registro público, as fichas, os comentários e as fotos.
          </p>
          <div className={styles.deletionNotice}>
            <strong>
              {participantCount === 1
                ? '1 avaliação de membro será apagada permanentemente.'
                : `${participantCount} avaliações de membros serão apagadas permanentemente.`}
            </strong>
            <p>Inclusive avaliações escritas por outras pessoas do grupo.</p>
          </div>
          <div className={styles.deletionConfirmation}>
            <Field
              autoComplete="off"
              autoFocus
              description={`Digite “${VISIT_DELETION_CONFIRMATION}” exatamente como aparece.`}
              disabled={pending}
              id="visit-deletion-confirmation"
              label="Confirmação de exclusão"
              onChange={(event) => setConfirmation(event.target.value)}
              spellCheck={false}
              value={confirmation}
            />
          </div>
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          <div className={styles.dialogActions}>
            <Button disabled={pending} onClick={closeDialog} variant="secondary">
              Cancelar
            </Button>
            <Button
              disabled={pending || confirmation !== VISIT_DELETION_CONFIRMATION}
              onClick={confirmDeletion}
              variant="danger"
            >
              {pending ? 'Excluindo...' : 'Deletar definitivamente'}
            </Button>
          </div>
        </div>
      </dialog>
    </section>
  );
}
