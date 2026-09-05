import { useId, type CSSProperties } from 'react';
import styles from './ui.module.css';

export interface ScoreRingProps {
  value: number | null;
  label: string;
  size?: 'small' | 'large';
}

const scoreFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const SCORE_COLORS = {
  darkRed: '#7f1d1d',
  red: '#dc2626',
  yellow: '#eab308',
  green: '#16a34a',
  blue: '#2563eb',
} as const;

function normalizeScore(value: number | null) {
  return value !== null && Number.isFinite(value)
    ? Math.min(10, Math.max(0, value))
    : null;
}

function interpolateColor(start: string, end: string, amount: number) {
  const channels = [1, 3, 5].map((index) => Math.round(
    Number.parseInt(start.slice(index, index + 2), 16)
      + (Number.parseInt(end.slice(index, index + 2), 16)
        - Number.parseInt(start.slice(index, index + 2), 16)) * amount,
  ));

  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export function scoreColorFor(value: number | null) {
  const normalizedValue = normalizeScore(value);

  if (normalizedValue === null) return null;
  if (normalizedValue <= 3) {
    return interpolateColor(SCORE_COLORS.darkRed, SCORE_COLORS.red, normalizedValue / 3);
  }
  if (normalizedValue < 6) {
    return interpolateColor(SCORE_COLORS.red, SCORE_COLORS.yellow, (normalizedValue - 3) / 3);
  }
  if (normalizedValue <= 8) {
    return interpolateColor(SCORE_COLORS.yellow, SCORE_COLORS.green, (normalizedValue - 6) / 2);
  }
  return interpolateColor(SCORE_COLORS.green, SCORE_COLORS.blue, (normalizedValue - 8) / 2);
}

export function ScoreRing({ value, label, size = 'small' }: ScoreRingProps) {
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
      aria-label={accessibleLabel}
      className={`${styles.scoreRing} ${styles[size]}`}
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
                style={{ '--score-stop-color': color } as CSSProperties}
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
      <span className={styles.scoreValue} aria-hidden="true">{formattedValue}</span>
      <span className={styles.scoreLabel} aria-hidden="true">{label}</span>
    </div>
  );
}
