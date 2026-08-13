import type { HistoricalReview } from '@/domain/reviews/repository';
import type { ScoreKey, ScoreValues } from '@/domain/reviews/types';

export type DisplayScoreValues = Record<ScoreKey, number | null>;

export const SCORE_ITEMS: ReadonlyArray<{ key: ScoreKey; label: string }> = [
  { key: 'food', label: 'Comida' },
  { key: 'service', label: 'Serviço' },
  { key: 'ambience', label: 'Ambiente' },
  { key: 'value', label: 'Custo-benefício' },
  { key: 'access', label: 'Acesso e localização' },
  { key: 'waitTime', label: 'Tempo de espera' },
];

const scoreFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const visitDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatScore(value: number | null): string {
  return value === null ? 'Não avaliado' : scoreFormatter.format(value);
}

export function formatVisitDate(value: string): string {
  return visitDateFormatter.format(new Date(value));
}

export function formatParticipation(participantCount: number): string {
  return participantCount === 1
    ? '1 craterista contribuiu'
    : `${participantCount} crateristas contribuíram`;
}

export interface VisitScoreSnapshot {
  scores: DisplayScoreValues | null;
  overall: number | null;
  historical: boolean;
}

export function getVisitScoreSnapshot(input: {
  averages: ScoreValues | null;
  overall: number | null;
  historical: HistoricalReview | null;
}): VisitScoreSnapshot {
  if (input.historical) {
    return {
      scores: input.historical.scores,
      overall: input.historical.overall,
      historical: true,
    };
  }

  return {
    scores: input.averages,
    overall: input.overall,
    historical: false,
  };
}
