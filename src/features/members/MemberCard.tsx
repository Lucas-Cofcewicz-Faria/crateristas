'use client';

import { useId, useState } from 'react';
import type { SocietyFragmentEntry } from '@/content/society';
import { SocietyFragment } from '@/components/society/SocietyFragment';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { MemberPortrait } from './MemberPortrait';
import styles from './members.module.css';

export interface MemberCardProps {
  avatarUrl: string | null;
  bio: string;
  displayName: string;
  favoriteCuisine: string | null;
  memberNumber: number;
  publicContributionCount: number;
  societyTitle: string | null;
  societyFragment: SocietyFragmentEntry | null;
}

export function MemberCard({
  avatarUrl,
  bio,
  displayName,
  favoriteCuisine,
  memberNumber,
  publicContributionCount,
  societyTitle,
  societyFragment,
}: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = `membro-${useId()}`;
  const entryNumber = String(memberNumber).padStart(2, '0');
  const contributionLabel = publicContributionCount === 1
    ? '1 contribuição pública'
    : `${publicContributionCount} contribuições públicas`;

  return (
    <article
      aria-label={`Craterista nº ${entryNumber}: ${displayName}`}
      className={styles.card}
    >
      <div className={styles.cardSummary}>
        <MemberPortrait avatarUrl={avatarUrl} displayName={displayName} />

        <div className={styles.identity}>
          <h2>{displayName}</h2>
          {societyTitle ? <p className={styles.societyTitle}>{societyTitle}</p> : null}
          <p className={styles.entryNumber}>
            <CraterLogo />
            <span>Craterista nº {entryNumber}</span>
          </p>
          <p className={styles.contributions}>{contributionLabel}</p>
        </div>

        <button
          aria-controls={panelId}
          aria-expanded={isExpanded}
          className={styles.expandButton}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          type="button"
        >
          {isExpanded ? `Recolher detalhes de ${displayName}` : `Conhecer ${displayName}`}
        </button>
      </div>

      <div
        aria-label={`Detalhes de ${displayName}`}
        className={styles.details}
        hidden={!isExpanded}
        id={panelId}
        role="region"
      >
        <p className={styles.bio}>{bio}</p>
        {favoriteCuisine ? (
          <p className={styles.favoriteCuisine}>Culinária favorita: {favoriteCuisine}</p>
        ) : null}
        {societyFragment ? (
          <SocietyFragment
            fragment={societyFragment}
            label={`Revelar fragmento da entrada ${entryNumber}`}
          />
        ) : null}
      </div>
    </article>
  );
}
