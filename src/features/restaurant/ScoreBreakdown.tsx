import type { HistoricalScoreValues } from '@/domain/reviews/repository';
import type { ScoreValues } from '@/domain/reviews/types';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ScoreText } from '@/components/ui/ScoreText';
import {
  formatParticipation,
  SCORE_ITEMS,
} from './restaurant-formatters';
import styles from './restaurant.module.css';

export interface ScoreBreakdownProps {
  scores: ScoreValues | HistoricalScoreValues | null;
  overall: number | null;
  participantCount: number;
  historical?: boolean;
}

export function ScorePlate({ label, value, className = '' }: { label: string; value: number | null; className?: string }) {
  return <div className={`${styles.scoreItem} ${className}`}>
    <dt>{label}</dt>
    <dd className={value === null ? styles.unassessed : undefined}>
      <ScoreText value={value} empty="Não avaliado" />
    </dd>
  </div>;
}

export function ScoreBreakdown({
  scores,
  overall,
  participantCount,
  historical = false,
}: ScoreBreakdownProps) {
  return (
    <section
      aria-label="Avaliação coletiva"
      className={styles.scoreBreakdown}
      data-motion="measure"
      role="region"
    >
      {historical && <p className={styles.historicalLabel}>Registro histórico</p>}
      <ScoreRing hideLabel label="Avaliação coletiva" size="large" value={overall} />
      <p className={styles.participation}>{formatParticipation(participantCount)}</p>
      <dl className={styles.scoreList}>
        {SCORE_ITEMS.map(({ key, label }) => (
          <ScorePlate key={key} label={label} value={scores?.[key] ?? null} />
        ))}
      </dl>
    </section>
  );
}
