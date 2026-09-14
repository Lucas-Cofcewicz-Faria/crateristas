'use client';

import { useId, type CSSProperties } from 'react';
import styles from './ui.module.css';
import { SCORE_COLORS, normalizeScore, scoreColorFor } from './score-color';
import { ScoreText } from './ScoreText';
import { useScoreMotion } from './useScoreMotion';
export { scoreColorFor } from './score-color';

export interface ScoreRingProps {
  value: number | null;
  label: string;
  size?: 'small' | 'large';
  hideLabel?: boolean;
}

const scoreFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});


export function ScoreRing({ value, label, size = 'small', hideLabel = false }: ScoreRingProps) {
  const motionRef = useScoreMotion<HTMLDivElement>();
  const normalizedValue = normalizeScore(value);
  const gradientId = `score-gradient-${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const formattedValue = normalizedValue === null ? '—' : scoreFormatter.format(normalizedValue);
  const accessibleLabel = normalizedValue === null
    ? `${label}: sem avaliação`
    : `${label}: ${formattedValue} de 10`;
  const progress = normalizedValue === null ? 0 : normalizedValue * 10;
  const stops = [-0.6, 0, 0.6].map((offset) => (
    scoreColorFor(normalizedValue === null ? null : normalizedValue + offset) ?? 'var(--line)'
  ));

  return (
    <div
      ref={motionRef}
      data-score-motion="paused"
      aria-label={accessibleLabel}
      className={`${styles.scoreRing} ${styles[size]} ${hideLabel ? styles.scoreNumberOnly : ''}`}
      role="img"
    >
      <svg className={styles.scoreGraphic} viewBox="0 0 44 44" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            {stops.map((color, index) => (
              <stop
                key={index}
                offset={`${index * 50}%`}
                stopColor={color}
                className={styles.scoreGradientStop}
                style={{ '--score-stop-color': color, '--score-stop-delay': `${index * -1.6}s` } as CSSProperties}
              />
            ))}
          </linearGradient>
        </defs>
        <circle className={styles.scoreTrack} cx="22" cy="22" r="19" pathLength="100"
          style={normalizedValue === 0 ? { stroke: SCORE_COLORS.darkRed } : undefined} />
        <circle
          className={`${styles.scoreProgress} ${normalizedValue === null ? styles.scoreProgressNeutral : ''}`}
          cx="22"
          cy="22"
          data-score-progress
          r="19"
          pathLength="100"
          stroke={normalizedValue === null ? 'currentColor' : `url(#${gradientId})`}
          strokeDasharray={`${progress} 100`}
        />
      </svg>
      <span className={styles.scoreValue} aria-hidden="true"><ScoreText value={normalizedValue} /></span>
      {!hideLabel && <span className={styles.scoreLabel} aria-hidden="true">{label}</span>}
    </div>
  );
}
