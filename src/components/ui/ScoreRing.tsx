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

export function ScoreRing({ value, label, size = 'small' }: ScoreRingProps) {
  const normalizedValue = value !== null && Number.isFinite(value)
    ? Math.min(10, Math.max(0, value))
    : null;
  const formattedValue = normalizedValue === null ? '—' : scoreFormatter.format(normalizedValue);
  const accessibleLabel = normalizedValue === null
    ? `${label}: sem avaliação`
    : `${label}: ${formattedValue} de 10`;
  const progress = normalizedValue === null ? 0 : normalizedValue * 10;

  return (
    <div
      aria-label={accessibleLabel}
      className={`${styles.scoreRing} ${styles[size]}`}
      role="img"
    >
      <svg className={styles.scoreGraphic} viewBox="0 0 44 44" aria-hidden="true">
        <circle className={styles.scoreTrack} cx="22" cy="22" r="19" pathLength="100" />
        <circle
          className={styles.scoreProgress}
          cx="22"
          cy="22"
          r="19"
          pathLength="100"
          strokeDasharray={`${progress} 100`}
        />
      </svg>
      <span className={styles.scoreValue} aria-hidden="true">{formattedValue}</span>
      <span className={styles.scoreLabel} aria-hidden="true">{label}</span>
    </div>
  );
}
