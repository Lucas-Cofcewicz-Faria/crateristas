import { describe, expect, it } from 'vitest';
import { aggregateScorecards } from './aggregate';

describe('aggregateScorecards', () => {
  it('returns one-decimal collective averages without exposing member scores', () => {
    expect(aggregateScorecards([
      { food: 8, service: 6, ambience: 7, value: 9, access: 4, waitTime: 8 },
      { food: 6, service: 8, ambience: 9, value: 7, access: 6, waitTime: 6 },
    ])).toEqual({
      participantCount: 2,
      averages: { food: 7, service: 7, ambience: 8, value: 8, access: 5, waitTime: 7 },
      overall: 7,
    });
  });

  it('rounds each average and the overall score to one decimal', () => {
    expect(aggregateScorecards([
      { food: 1, service: 1, ambience: 1, value: 1, access: 1, waitTime: 1 },
      { food: 2, service: 2, ambience: 2, value: 2, access: 2, waitTime: 2 },
      { food: 2, service: 2, ambience: 2, value: 2, access: 2, waitTime: 2 },
    ])).toEqual({
      participantCount: 3,
      averages: { food: 1.7, service: 1.7, ambience: 1.7, value: 1.7, access: 1.7, waitTime: 1.7 },
      overall: 1.7,
    });
  });

  it('returns no averages when no one has contributed a scorecard', () => {
    expect(aggregateScorecards([])).toEqual({
      participantCount: 0,
      averages: null,
      overall: null,
    });
  });
});
