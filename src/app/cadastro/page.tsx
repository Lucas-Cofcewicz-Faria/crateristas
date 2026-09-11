import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/shell/PublicShell';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { SignupForm } from '@/features/auth/SignupForm';
import { validateSharedInvite } from '@/features/auth/invite-repository';
import styles from '@/features/auth/auth.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Entre para os Crateristas', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ convite?: string | string[] }> }) {
  const { convite } = await searchParams;
  const token = typeof convite === 'string' ? convite : '';
  let valid = false;
  let unavailable = false;
  try { valid = Boolean(await validateSharedInvite(token)); } catch { unavailable = true; }
  return (
    <PublicShell viewer="visitor">
      <section className={styles.loginPage}>
        <div className={styles.loginCopy}>
          <CraterLogo className={styles.loginMark} />
          <h1>Seu lugar à mesa.</h1>
          <p>Entre para a sociedade, compartilhe suas impressões e ajude a escrever os próximos registros da cratera. Avalie quando quiser.</p>
        </div>
        <div className={styles.loginCard}>
          <h2>{valid ? 'Cadastro de craterista' : unavailable ? 'Cadastro indisponível' : 'Convite necessário'}</h2>
          {valid ? <SignupForm token={token} /> : <div className={styles.invalidLinkPanel}>
            <p>{unavailable ? 'Não foi possível consultar o convite agora. Recarregue a página em instantes.' : 'Use o link compartilhado no grupo. Se ele foi desativado ou substituído, peça o convite atual ao administrador.'}</p>
            <Link className={styles.textLink} href="/entrar">Já tenho conta</Link>
          </div>}
        </div>
      </section>
    </PublicShell>
  );
}
