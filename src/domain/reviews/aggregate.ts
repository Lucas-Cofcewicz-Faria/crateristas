import { SCORE_KEYS, type ReviewAggregate, type ScoreValues } from './types';

function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function aggregateScorecards(scores: ScoreValues[]): ReviewAggregate {
  if (scores.length === 0) {
    return { participantCount: 0, averages: null, overall: null };
  }

  const totals: ScoreValues = {
    food: 0,
    service: 0,
    ambience: 0,
    value: 0,
    access: 0,
    waitTime: 0,
  };

  for (const scorecard of scores) {
    for (const key of SCORE_KEYS) {
      totals[key] += scorecard[key];
    }
  }

  const averages = Object.fromEntries(
    SCORE_KEYS.map((key) => [key, roundToOneDecimal(totals[key] / scores.length)]),
  ) as ScoreValues;
  const overall = roundToOneDecimal(
    SCORE_KEYS.reduce((total, key) => total + totals[key], 0) / (scores.length * SCORE_KEYS.length),
  );

  return { participantCount: scores.length, averages, overall };
}
