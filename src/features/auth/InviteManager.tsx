'use client';

import { useState } from 'react';
import { Copy, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { manageInviteAction } from './signup-actions';
import styles from './invite.module.css';

export function InviteManager({ initialInvite }: { initialInvite: { active: boolean; token: string | null } }) {
  const [invite, setInvite] = useState(initialInvite);
  const [confirm, setConfirm] = useState<'replace' | 'disable' | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [fallbackLink, setFallbackLink] = useState('');

  async function update(command: 'replace' | 'disable') {
    setPending(true); setMessage('');
    try {
      const result = await manageInviteAction(command);
      if (result.error) { setMessage(result.error); return; }
      setInvite(result); setFallbackLink(''); setConfirm(null);
      setMessage(result.active ? 'Convite pronto. Copie o link e envie no grupo.' : 'Convite desativado. Os membros cadastrados mantêm o acesso.');
    } catch { setMessage('Não foi possível conectar. Tente novamente.'); }
    finally { setPending(false); }
  }

  async function copy() {
    if (!invite.token) return;
    const link = new URL('/cadastro', window.location.origin);
    link.searchParams.set('convite', invite.token);
    try { await navigator.clipboard.writeText(link.href); setMessage('Link copiado para compartilhar no grupo.'); }
    catch { setFallbackLink(link.href); setMessage('Selecione e copie o link abaixo.'); }
  }

  return <section className={styles.manager} aria-labelledby="invite-title">
    <div><h2 id="invite-title">Convide os Crateristas</h2>
      <p>Um único link para o grupo do WhatsApp. Quem receber ou encaminhar o convite poderá criar uma conta de integrante.</p>
      <p className={styles.status}>{invite.active ? 'Convite ativo · reutilizável' : 'Cadastros por convite desativados'}</p>
    </div>
    <div className={styles.actions}>
      {invite.active ? <>
        <Button onClick={copy} disabled={pending}><Copy size={18} aria-hidden="true" />Copiar convite</Button>
        <Button variant="secondary" disabled={pending} onClick={() => setConfirm('replace')}>Gerar outro link</Button>
        <Button variant="secondary" disabled={pending} onClick={() => setConfirm('disable')}>Desativar convite</Button>
      </> : <Button disabled={pending} onClick={() => update('replace')}><LinkIcon size={18} aria-hidden="true" />{pending ? 'Criando...' : 'Criar convite do grupo'}</Button>}
    </div>
    {confirm ? <div className={styles.confirmation}>
      <p>{confirm === 'replace' ? 'O link antigo deixará de funcionar. Envie o novo link no grupo depois de confirmar.' : 'O link deixará de aceitar cadastros. Contas já cadastradas não serão removidas.'}</p>
      <div className={styles.actions}><Button disabled={pending} onClick={() => update(confirm)}>{pending ? 'Salvando...' : 'Confirmar'}</Button><Button variant="secondary" disabled={pending} onClick={() => setConfirm(null)}>Cancelar</Button></div>
    </div> : null}
    {message ? <p role="status">{message}</p> : null}
    {fallbackLink ? <label className={styles.copyField}>Link de cadastro<input readOnly value={fallbackLink} onFocus={(event) => event.currentTarget.select()} /></label> : null}
  </section>;
}
