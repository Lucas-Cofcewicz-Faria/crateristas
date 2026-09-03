import type { HistoricalScoreValues } from '@/domain/reviews/repository';
import type { ScoreValues } from '@/domain/reviews/types';
import { ScoreRing } from '@/components/ui/ScoreRing';
import {
  formatParticipation,
  formatScore,
  SCORE_ITEMS,
} from './restaurant-formatters';
import styles from './restaurant.module.css';

export interface ScoreBreakdownProps {
  scores: ScoreValues | HistoricalScoreValues | null;
  overall: number | null;
  participantCount: number;
  historical?: boolean;
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
      <p className={styles.scoreEyebrow}>
        {historical ? 'Registro histórico' : 'Leitura coletiva'}
      </p>
      <ScoreRing label="Nota coletiva" size="large" value={overall} />
      <p className={styles.participation}>{formatParticipation(participantCount)}</p>
      <dl className={styles.scoreList}>
        {SCORE_ITEMS.map(({ key, label }) => (
          <div className={styles.scoreItem} key={key}>
            <dt>{label}</dt>
            <dd className={scores?.[key] === null || !scores ? styles.unassessed : undefined}>
              {formatScore(scores?.[key] ?? null)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
