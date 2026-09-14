'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { setMemberTitleAction } from './profile-actions';
import styles from './member-manager.module.css';

export function MemberTitleEditor({ memberId, displayName, societyTitle }: { memberId: string; displayName: string; societyTitle: string | null }) {
  const [title, setTitle] = useState(societyTitle ?? '');
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const router = useRouter();
  return <details className={styles.titleEditor}>
    <summary>Definir cargo de {displayName}</summary>
    <form aria-label={`Cargo de ${displayName}`} aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      if (pending) return;
      setFeedback(null);
      const data = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const result = await setMemberTitleAction(data);
          if (result.error) { setFeedback({ error: true, text: result.error }); return; }
          setTitle(title.trim());
          setFeedback({ error: false, text: 'Cargo atualizado no perfil público.' });
          router.refresh();
        } catch { setFeedback({ error: true, text: 'Não foi possível salvar o cargo. Tente novamente.' }); }
      });
    }}>
      <input type="hidden" name="memberId" value={memberId} />
      <label htmlFor={`title-${memberId}`}>Cargo oficial</label>
      <input id={`title-${memberId}`} name="societyTitle" value={title} maxLength={60} disabled={pending}
        aria-describedby={`title-help-${memberId}`} onChange={(event) => setTitle(event.target.value)} />
      <p id={`title-help-${memberId}`}>Até 60 caracteres. Deixe vazio para retirar o cargo. Isso não altera permissões de acesso.</p>
      <Button type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Salvar cargo'}</Button>
      {feedback ? <p role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p> : null}
    </form>
  </details>;
}
