'use client';

import { useRef, useState, useTransition } from 'react';
import { UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MemberPortrait } from './MemberPortrait';
import { removeMemberAction } from './member-actions';
import { MEMBER_REMOVAL_CONFIRMATION, type ManagedMember } from './member-management-state';
import styles from './member-manager.module.css';

function MemberRemoval({ member, onRemoved }: { member: ManagedMember; onRemoved: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trigger = useRef<HTMLButtonElement>(null);

  function cancel() {
    setConfirming(false); setConfirmation(''); setError(null);
    trigger.current?.focus();
  }

  return <>
    <div className={styles.removeControl}>
      <Button ref={trigger} variant="secondary" disabled={pending} aria-label={`Remover ${member.displayName}`}
        aria-expanded={confirming} aria-controls={`remove-${member.id}`} onClick={() => setConfirming(true)}>
        <UserMinus size={17} aria-hidden="true" />Remover integrante
      </Button>
    </div>
    {confirming ? <form id={`remove-${member.id}`} aria-label={`Remover ${member.displayName}`}
      className={styles.confirmation} aria-busy={pending}
      onKeyDown={(event) => { if (event.key === 'Escape' && !pending) { event.preventDefault(); cancel(); } }}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || confirmation !== MEMBER_REMOVAL_CONFIRMATION) return;
        const data = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          try {
            const result = await removeMemberAction(data);
            if (result.error) { setError(result.error); return; }
            onRemoved();
          } catch { setError('Não foi possível conectar. Tente novamente.'); }
        });
      }}>
      <h3>Remover {member.displayName} da sociedade?</h3>
      <p>{member.scorecardCount === 1 ? '1 avaliação será preservada' : `${member.scorecardCount} avaliações serão preservadas`}, junto com os comentários e fotos.
        O integrante perderá o acesso ao painel, sairá da lista pública e não poderá voltar pelo convite com esta conta ou e-mail.</p>
      <input type="hidden" name="memberId" value={member.id} />
      <label htmlFor={`confirmation-${member.id}`}>Para confirmar, digite <strong>{MEMBER_REMOVAL_CONFIRMATION}</strong></label>
      <input id={`confirmation-${member.id}`} name="confirmation" value={confirmation} required
        ref={(element) => { element?.focus(); }} autoComplete="off" spellCheck={false} disabled={pending}
        onChange={(event) => setConfirmation(event.target.value)} />
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.actions}>
        <Button type="submit" variant="danger" disabled={pending || confirmation !== MEMBER_REMOVAL_CONFIRMATION}>
          {pending ? 'Removendo...' : 'Confirmar remoção'}
        </Button>
        <Button variant="secondary" disabled={pending} onClick={cancel}>Cancelar</Button>
      </div>
    </form> : null}
  </>;
}

export function MemberManager({ members, currentMemberId }: { members: ManagedMember[]; currentMemberId: string }) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const active = members.filter((member) => !member.removedAt && !removedIds.includes(member.id));
  const removed = members.filter((member) => member.removedAt || removedIds.includes(member.id));

  return <section className={styles.manager} aria-labelledby="members-management-title">
    <header className={styles.header}>
      <div><h2 id="members-management-title" ref={heading} tabIndex={-1}>Gerenciar integrantes</h2>
        <p>Controle quem faz parte da sociedade. Remover o acesso não apaga a história das mesas.</p></div>
      <span className={styles.count}>{active.length} {active.length === 1 ? 'ativo' : 'ativos'}</span>
    </header>
    {message ? <p className={styles.feedback} role="status">{message}</p> : null}
    <ul className={styles.list}>
      {active.map((member) => <li key={member.id} className={styles.row}>
        <div className={styles.identity}>
          <div className={styles.portrait}><MemberPortrait avatarUrl={member.avatarUrl} displayName={member.displayName} /></div>
          <div><h3>{member.displayName}</h3><p>{member.scorecardCount} {member.scorecardCount === 1 ? 'avaliação' : 'avaliações'}</p></div>
        </div>
        {member.role === 'admin' || member.id === currentMemberId ? <span className={styles.protected}>Administrador · conta protegida</span>
          : <MemberRemoval member={member} onRemoved={() => {
            setRemovedIds((ids) => [...ids, member.id]);
            setMessage(`${member.displayName} foi removido da sociedade. Avaliações e fotos foram preservadas.`);
            heading.current?.focus();
          }} />}
      </li>)}
    </ul>
    {active.length === 0 ? <p>Nenhum integrante ativo.</p> : null}
    {removed.length > 0 ? <details className={styles.removed}>
      <summary>Integrantes removidos ({removed.length})</summary>
      <ul>{removed.map((member) => <li key={member.id}><span>{member.displayName}</span><span>Acesso removido · histórico preservado</span></li>)}</ul>
    </details> : null}
  </section>;
}
