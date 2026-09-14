'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { ScoreSlider } from '@/components/ui/ScoreSlider';
import { scorecardSchema, type ScorecardInput } from '@/domain/reviews/schemas';
import { type ScoreKey } from '@/domain/reviews/types';
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
  dish: '',
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
  children?: ReactNode;
}

function remainingLabel(count: number): string {
  return count === 1 ? '1 caractere restante' : `${count} caracteres restantes`;
}

export function ScorecardForm({ visitId, initialValues, onSaved, children }: ScorecardFormProps) {
  const [values, setValues] = useState<ScorecardInput>(initialValues ?? EMPTY_SCORECARD);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmittedScorecardResponse | null>(null);
  const remaining = 180 - values.comment.length;

  function updateScore(key: ScoreKey, value: number) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = scorecardSchema.safeParse(values);
    if (!parsed.success) {
      const dishIssue = parsed.error.flatten().fieldErrors.dish?.[0];
      const commentIssue = parsed.error.flatten().fieldErrors.comment?.[0];
      setError(dishIssue ?? commentIssue ?? 'Revise as notas informadas.');
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
        <h2 id="scorecard-title">Ficha de avaliação</h2>
        <p>Use notas inteiras de 0 a 10. Cada critério também mostra o número escolhido.</p>
      </header>
      <form className={styles.scorecardForm} noValidate onSubmit={handleSubmit}>
        <div className={styles.scoreGrid}>
          {SCORE_FIELDS.map((field) => (
            <ScoreSlider
              key={field.key}
              id={`score-${field.key}`}
              label={field.label}
              description={field.description}
              value={values[field.key]}
              onChange={(value) => updateScore(field.key, value)}
              disabled={pending}
            />
          ))}
        </div>

        <div className={styles.dishField}>
          <label htmlFor="score-dish">Prato pedido (opcional)</label>
          <input
            id="score-dish"
            maxLength={80}
            onChange={(event) => setValues((current) => ({
              ...current,
              dish: event.target.value,
            }))}
            placeholder="Ex.: Lámen tonkotsu"
            type="text"
            value={values.dish ?? ''}
          />
          <p>O prato aparecerá junto do seu comentário na mesa.</p>
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
              <p>{result.participantCount} {result.participantCount === 1 ? 'contribuição recebida' : 'contribuições recebidas'}.</p>
              <p>Média coletiva: {scoreFormatter.format(result.aggregate.overall)} de 10.</p>
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
      {children}
    </section>
  );
}
