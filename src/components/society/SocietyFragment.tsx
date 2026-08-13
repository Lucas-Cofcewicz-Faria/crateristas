'use client';

import { useId, useState } from 'react';
import type { SocietyFragmentEntry } from '@/content/society';
import { SocietyMark } from './SocietyMark';
import styles from './society.module.css';

export interface SocietyFragmentProps {
  fragment: SocietyFragmentEntry;
  label: string;
}

export function SocietyFragment({ fragment, label }: SocietyFragmentProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const panelId = `fragmento-${useId()}`;

  return (
    <div className={styles.fragment}>
      <button
        aria-controls={panelId}
        aria-expanded={isRevealed}
        aria-label={label}
        className={styles.markButton}
        onClick={() => setIsRevealed(true)}
        onFocus={() => setIsRevealed(true)}
        type="button"
      >
        <SocietyMark decorative />
        <span aria-hidden="true">Arquivo reservado</span>
      </button>
      <p className={styles.fragmentText} hidden={!isRevealed} id={panelId} role="note">
        {fragment.text}
      </p>
    </div>
  );
}
