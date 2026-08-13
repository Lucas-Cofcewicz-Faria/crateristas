'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { scorecardSchema, type ScorecardInput } from '@/domain/reviews/schemas';
import { CRATERISTAS_GROUP_SIZE, type ScoreKey } from '@/domain/reviews/types';
import { PublicationStatus } from './PublicationStatus';
import { submitScorecard, type SubmittedScorecardResponse } from './visit-api';
import styles from './review-workflow.module.css';

const SCORE_FIELDS: ReadonlyArray<{
  key: ScoreKey;
  label: string;
  description: string;
}> = [
  { key: 'food', label: 'Comida', description: 'Considere sabor, preparo e apresentação.' },
  { key: 'service', label: 'Serviço', description: 'Considere atenção, clareza e ritmo do atendimento.' },
  { key: 'ambience', label: 'Ambiente', description: 'Considere conforto, acústica e atmosfera.' },
  { key: 'value', label: 'Custo-benefício', description: 'Considere a experiência em relação ao preço.' },
  { key: 'access', label: 'Acesso/localização', description: 'Considere chegada, mobilidade e localização.' },
  { key: 'waitTime', label: 'Tempo de espera', description: 'Considere espera por mesa, pedidos e pratos.' },
];

const EMPTY_SCORECARD: ScorecardInput = {
  food: 0,
  service: 0,
  ambience: 0,
  value: 0,
  access: 0,
  waitTime: 0,
  comment: '',
};

const scoreFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export interface ScorecardFormProps {
  visitId: string;
  initialValues: ScorecardInput | null;
  onSaved?(result: SubmittedScorecardResponse): void;
}

function remainingLabel(count: number): string {
  return count === 1 ? '1 caractere restante' : `${count} caracteres restantes`;
}

export function ScorecardForm({ visitId, initialValues, onSaved }: ScorecardFormProps) {
  const [values, setValues] = useState<ScorecardInput>(initialValues ?? EMPTY_SCORECARD);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmittedScorecardResponse | null>(null);
  const remaining = 180 - values.comment.length;

  function updateScore(key: ScoreKey, value: number) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleScoreKeyDown(event: KeyboardEvent<HTMLInputElement>, key: ScoreKey) {
    const current = values[key];
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? 10
        : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? Math.min(10, current + 1)
          : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? Math.max(0, current - 1)
            : null;
    if (next === null) return;
    event.preventDefault();
    updateScore(key, next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = scorecardSchema.safeParse(values);
    if (!parsed.success) {
      const commentIssue = parsed.error.flatten().fieldErrors.comment?.[0];
      setError(commentIssue ?? 'Revise as notas informadas.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const saved = await submitScorecard(visitId, parsed.data);
      setResult(saved);
      onSaved?.(saved);
    } catch {
      setError('Não foi possível salvar a avaliação. Tente novamente.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.scorecardSection} aria-labelledby="scorecard-title">
      <header className={styles.sectionIntro}>
        <p className={styles.eyebrow}>Sua contribuição</p>
        <h2 id="scorecard-title">Ficha de avaliação</h2>
        <p>Use notas inteiras de 0 a 10. Cada critério também mostra o número escolhido.</p>
      </header>
      <form className={styles.scorecardForm} noValidate onSubmit={handleSubmit}>
        <div className={styles.scoreGrid}>
          {SCORE_FIELDS.map((field) => {
            const descriptionId = `score-${field.key}-description`;
            return (
              <div className={styles.scoreControl} key={field.key}>
                <div className={styles.scoreHeading}>
                  <label htmlFor={`score-${field.key}`}>{field.label}</label>
                  <output htmlFor={`score-${field.key}`}>{values[field.key]} de 10</output>
                </div>
                <input
                  aria-describedby={descriptionId}
                  id={`score-${field.key}`}
                  max="10"
                  min="0"
                  onChange={(event) => updateScore(field.key, Number(event.target.value))}
                  onKeyDown={(event) => handleScoreKeyDown(event, field.key)}
                  step="1"
                  type="range"
                  value={values[field.key]}
                />
                <p id={descriptionId}>{field.description}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.commentField}>
          <div className={styles.commentHeading}>
            <label htmlFor="score-comment">Comentário</label>
            <span aria-live="polite">{remainingLabel(remaining)}</span>
          </div>
          <textarea
            aria-invalid={error ? true : undefined}
            id="score-comment"
            maxLength={180}
            onChange={(event) => setValues((current) => ({
              ...current,
              comment: event.target.value,
            }))}
            required
            rows={5}
            value={values.comment}
          />
        </div>

        {error ? <p className={styles.formError} role="alert">{error}</p> : null}
        {result ? (
          <div aria-label="Status da avaliação" className={styles.saveStatus} role="status">
            <div>
              <strong>Avaliação salva.</strong>
              <p>{result.participantCount} de {CRATERISTAS_GROUP_SIZE} membros contribuíram.</p>
              {result.aggregate.overall === null ? null : (
                <p>Média coletiva: {scoreFormatter.format(result.aggregate.overall)} de 10.</p>
              )}
            </div>
            <PublicationStatus state={result.publicationState} />
          </div>
        ) : null}
        <div className={styles.formActions}>
          <Button disabled={pending} type="submit">
            {pending ? 'Salvando...' : 'Salvar avaliação'}
          </Button>
        </div>
      </form>
    </section>
  );
}
