import Image from 'next/image';
import Link from 'next/link';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { getTrustedMemberAvatarUrl } from '@/features/members/member-avatar';
import styles from './home.module.css';

export function MembersPreview({ members }: { members: readonly PublicMemberSummary[] }) {
  const visibleMembers = members.slice(0, 8);

  return (
    <section aria-labelledby="members-preview-title" className={styles.membersPreview} id="sociedade">
      <header className={styles.sectionHeader}>
        <h2 data-motion="inscription" id="members-preview-title">Os oito Crateristas</h2>
        <Link className={styles.textAction} href="/historia#integrantes">Conheça os integrantes</Link>
      </header>
      {visibleMembers.length === 0 ? (
        <div className={styles.membersEmpty} role="status">
          O diretório da Sociedade ainda está em preparação.
        </div>
      ) : (
        <div aria-label="Prévia dos integrantes" className={styles.memberConstellation} role="list">
          {visibleMembers.map((member, index) => {
            const avatarUrl = getTrustedMemberAvatarUrl(member.avatarUrl);
            const memberNumber = String(member.memberNumber).padStart(2, '0');

            return (
              <article
                className={styles.memberPortrait}
                data-motion="constellation"
                data-motion-index={index}
                key={member.slug}
                role="listitem"
              >
                <div className={styles.portraitFrame}>
                  {avatarUrl ? (
                    <Image
                      alt={`Retrato de ${member.displayName}`}
                      fill
                      sizes="(max-width: 1280px) 20vw, 180px"
                      src={avatarUrl}
                    />
                  ) : (
                    <span aria-hidden="true">{memberNumber}</span>
                  )}
                </div>
                <p>Craterista nº {memberNumber}</p>
                <h3>{member.displayName}</h3>
                {member.societyTitle ? <span>{member.societyTitle}</span> : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
