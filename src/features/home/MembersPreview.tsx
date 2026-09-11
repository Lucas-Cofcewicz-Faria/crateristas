import Link from 'next/link';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { MemberPortrait } from '@/features/members/MemberPortrait';
import styles from './members-preview.module.css';

export function MembersPreview({ members }: { members: readonly PublicMemberSummary[] }) {
  const visibleMembers = members;

  return (
    <section aria-labelledby="members-preview-title" className={styles.membersPreview} id="sociedade">
      <header className={styles.sectionHeader}>
        <h2 data-motion="inscription" id="members-preview-title">{members.length} {members.length === 1 ? 'Craterista' : 'Crateristas'}</h2>
        <Link className={styles.textAction} href="/historia#integrantes">Conheça os integrantes</Link>
      </header>
      {visibleMembers.length === 0 ? (
        <div className={styles.membersEmpty} role="status">
          O diretório da Sociedade ainda está em preparação.
        </div>
      ) : (
        <div aria-label="Prévia dos integrantes" className={styles.memberConstellation} role="list">
          {visibleMembers.map((member, index) => {
            const memberNumber = String(member.memberNumber).padStart(2, '0');

            return (
              <article
                className={styles.memberPortrait}
                data-motion="constellation"
                data-motion-index={index}
                key={member.slug}
                role="listitem"
              >
                <MemberPortrait avatarUrl={member.avatarUrl} displayName={member.displayName} />
                <h3>{member.displayName}</h3>
                {member.societyTitle ? <span>{member.societyTitle}</span> : null}
                <p>Craterista nº {memberNumber}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
