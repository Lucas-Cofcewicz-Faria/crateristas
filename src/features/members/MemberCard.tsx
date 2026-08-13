'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import type { SocietyFragmentEntry } from '@/content/society';
import { SocietyFragment } from '@/components/society/SocietyFragment';
import { SocietyMark } from '@/components/society/SocietyMark';
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

function getInitials(displayName: string): string {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR'))
    .join('');
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
        <div className={styles.avatarFrame}>
          {avatarUrl ? (
            <Image
              alt={`Retrato de ${displayName}`}
              className={styles.avatar}
              height={128}
              sizes="128px"
              src={avatarUrl}
              width={128}
            />
          ) : (
            <span
              aria-label={`Iniciais de ${displayName}: ${getInitials(displayName)}`}
              className={styles.avatarFallback}
              role="img"
            >
              {getInitials(displayName)}
            </span>
          )}
        </div>

        <div className={styles.identity}>
          <p className={styles.entryNumber}>
            <SocietyMark />
            <span>Craterista nº {entryNumber}</span>
          </p>
          <h2>{displayName}</h2>
          {societyTitle ? <p className={styles.societyTitle}>{societyTitle}</p> : null}
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
