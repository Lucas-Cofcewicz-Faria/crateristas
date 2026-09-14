'use client';

import type { CSSProperties } from 'react';
import { normalizeScore, scoreColorFor } from './score-color';
import { useScoreMotion } from './useScoreMotion';
import styles from './ui.module.css';

const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function ScoreText({ value, empty = '—' }: { value: number | null; empty?: string }) {
  const motionRef = useScoreMotion<HTMLSpanElement>();
  const score = normalizeScore(value);
  if (score === null) return <span ref={motionRef} data-score-motion="paused">{empty}</span>;
  return <span ref={motionRef} data-score-motion="paused" className={styles.scoreText} style={{
    '--score-text-base': scoreColorFor(score),
    '--score-text-end': scoreColorFor(score + 0.6),
  } as CSSProperties}>{formatter.format(score)}</span>;
}
