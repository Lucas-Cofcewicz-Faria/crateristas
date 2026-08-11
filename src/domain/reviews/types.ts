export const SCORE_KEYS = ['food', 'service', 'ambience', 'value', 'access', 'waitTime'] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];
export type ScoreValues = Record<ScoreKey, number>;
export type PublicationState = 'private' | 'published' | 'hidden';
export type PublicationReason = 'quorum' | 'admin_override' | null;

export interface ReviewAggregate {
  participantCount: number;
  averages: ScoreValues | null;
  overall: number | null;
}

export interface PublicVisitFilters {
  busca?: string;
  culinaria?: string;
  bairro?: string;
}
