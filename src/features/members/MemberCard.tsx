'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { SocietyFragmentEntry } from '@/content/society';
import { CraterLogo } from '@/components/brand/CraterLogo';
import { MemberPortrait } from './MemberPortrait';
import styles from './members.module.css';

export interface MemberCardProps {
  headingLevel?: 2 | 3;
  slug: string;
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
  headingLevel = 2,
  slug,
  avatarUrl,
  displayName,
  memberNumber,
  publicContributionCount,
  societyTitle,
}: MemberCardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const entryNumber = String(memberNumber).padStart(2, '0');
  const contributionLabel = publicContributionCount === 1
    ? '1 contribuição pública'
    : `${publicContributionCount} contribuições públicas`;

  return (
    <article
      aria-label={`Craterista nº ${entryNumber}: ${displayName}`}
      className={styles.card}
    >
      <Link className={styles.cardSummary} href={`/membros/${slug}`} aria-label={`Conhecer ${displayName}`}>
        <MemberPortrait avatarUrl={avatarUrl} displayName={displayName} />

        <div className={styles.identity}>
          <Heading>{displayName}</Heading>
          <p className={styles.entryNumber}>
            <CraterLogo />
            <span>{societyTitle || 'Integrante'}</span>
          </p>
          <p className={styles.memberNumber}>Craterista nº {entryNumber}</p>
          <p className={styles.contributions}>{contributionLabel}</p>
        </div>

        <span className={styles.expandButton}>Conhecer {displayName}<ArrowUpRight size={18} aria-hidden="true" /></span>
      </Link>
    </article>
  );
}
