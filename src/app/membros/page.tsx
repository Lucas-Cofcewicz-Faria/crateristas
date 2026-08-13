import Link from 'next/link';
import { PublicShell } from '@/components/shell/PublicShell';
import { MemberGrid } from '@/features/members/MemberGrid';
import styles from '@/features/members/members.module.css';
import { findOptionalMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const repository = getReviewRepository();
  const [members, viewer] = await Promise.all([
    repository.listPublicMembers(),
    findOptionalMember(),
  ]);

  return (
    <PublicShell viewer={viewer ? 'member' : 'visitor'}>
      <section className={styles.directory}>
        <header className={styles.directoryHeader}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Diretório público</p>
            <h1 className={styles.directoryTitle}>Os oito Crateristas</h1>
            <p className={styles.directoryLead}>
              O arquivo apresenta os integrantes da sociedade por suas contribuições
              públicas, afinidades à mesa e títulos preservados no livro.
            </p>
          </div>
          {viewer ? (
            <Link className={styles.pendingLink} href="/painel">
              Suas avaliações pendentes
            </Link>
          ) : null}
        </header>
        <MemberGrid members={members} />
      </section>
    </PublicShell>
  );
}
