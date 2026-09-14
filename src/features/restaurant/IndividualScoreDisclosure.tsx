'use client';

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ScoreText } from '@/components/ui/ScoreText';
import type { ScoreKey, ScoreValues } from '@/domain/reviews/types';
import styles from './restaurant.module.css';

const SCORE_ROWS: ReadonlyArray<{ key: ScoreKey; label: string }> = [
  { key: 'food', label: 'Comida' },
  { key: 'service', label: 'Serviço' },
  { key: 'ambience', label: 'Ambiente' },
  { key: 'value', label: 'Custo-benefício' },
  { key: 'access', label: 'Acesso/localização' },
  { key: 'waitTime', label: 'Tempo de espera' },
];


export interface IndividualScoreDisclosureProps {
  displayName: string;
  scores: ScoreValues;
  overall: number;
}

export function IndividualScoreDisclosure({
  displayName,
  scores,
  overall,
}: IndividualScoreDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();
  const action = expanded ? 'Ocultar notas' : 'Ver notas';

  return (
    <div className={styles.scoreDisclosure}>
      <button
        aria-controls={regionId}
        aria-expanded={expanded}
        aria-label={`${action} de ${displayName}`}
        className={styles.scoreToggle}
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {action}
        <ChevronDown aria-hidden="true" size={16} />
      </button>
      <div
        className={styles.individualScoresClip}
        data-expanded={expanded}
        data-score-disclosure={displayName}
      >
        <div>
          <section
            aria-hidden={!expanded}
            aria-label={`Notas de ${displayName}`}
            className={styles.individualScores}
            id={regionId}
          >
            <div className={styles.individualOverall}>
              <span>Média pessoal</span>
              <strong><ScoreText value={overall} /></strong>
            </div>
            <dl className={styles.individualScoreList}>
              {SCORE_ROWS.map(({ key, label }) => (
                <div className={styles.individualScore} key={key}>
                  <dt>{label}</dt>
                  <dd><ScoreText value={scores[key]} /></dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
