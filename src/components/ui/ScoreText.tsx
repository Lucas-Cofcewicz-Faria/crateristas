import type { CSSProperties } from 'react';
import { normalizeScore, scoreColorFor } from './score-color';
import styles from './ui.module.css';

const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function ScoreText({ value, empty = '—' }: { value: number | null; empty?: string }) {
  const score = normalizeScore(value);
  if (score === null) return <span>{empty}</span>;
  return <span className={styles.scoreText} style={{
    '--score-text-base': scoreColorFor(score),
    '--score-text-end': scoreColorFor(score + 0.6),
  } as CSSProperties}>{formatter.format(score)}</span>;
}
