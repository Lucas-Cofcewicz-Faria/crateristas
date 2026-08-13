import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { getSocietyFragmentForMember } from '@/content/society';
import { MemberCard } from './MemberCard';
import { getTrustedMemberAvatarUrl } from './member-avatar';
import styles from './members.module.css';

export interface MemberGridProps {
  members: PublicMemberSummary[];
}

export function MemberGrid({ members }: MemberGridProps) {
  if (members.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <span aria-hidden="true">C</span>
        <h2>Nenhum craterista publicado</h2>
        <p>O diretório público ainda não recebeu suas primeiras entradas.</p>
      </div>
    );
  }

  const visibleMembers = members.slice(0, 8);

  return (
    <div aria-label="Diretório dos Crateristas" className={styles.grid} role="list">
      {visibleMembers.map((member) => (
        <div key={member.slug} role="listitem">
          <MemberCard
            avatarUrl={getTrustedMemberAvatarUrl(member.avatarUrl)}
            bio={member.bio}
            displayName={member.displayName}
            favoriteCuisine={member.favoriteCuisine}
            memberNumber={member.memberNumber}
            publicContributionCount={member.contributions.publishedVisits}
            societyFragment={getSocietyFragmentForMember(member.memberNumber)}
            societyTitle={member.societyTitle}
          />
        </div>
      ))}
    </div>
  );
}
