import Link from 'next/link';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { MemberGrid } from '@/features/members/MemberGrid';
import styles from './members-preview.module.css';

export function MembersPreview({ members }: { members: readonly PublicMemberSummary[] }) {
  return (
    <section aria-labelledby="members-preview-title" className={styles.membersPreview} id="sociedade">
      <header className={styles.sectionHeader}>
        <h2 data-motion="inscription" id="members-preview-title">{members.length} {members.length === 1 ? 'Craterista' : 'Crateristas'}</h2>
        <Link className={styles.textAction} href="/historia#integrantes">Conheça os integrantes</Link>
      </header>
      {members.length === 0 ? (
        <div className={styles.membersEmpty} role="status">
          O diretório da Sociedade ainda está em preparação.
        </div>
      ) : (
        <div className={styles.directory}>
          <MemberGrid members={members} headingLevel={3} />
        </div>
      )}
    </section>
  );
}
