import { describe, expect, it } from 'vitest';
import * as formatters from './visit-formatters';

describe('formatEvaluationCount', () => {
  const formatEvaluationCount = Reflect.get(
    formatters,
    'formatEvaluationCount',
  ) as undefined | ((count: number) => string);

  it.each([
    { count: 0, expected: '0 avaliações' },
    { count: 1, expected: '1 avaliação' },
    { count: 2, expected: '2 avaliações' },
  ])('flexiona $count como "$expected"', ({ count, expected }) => {
    expect(formatEvaluationCount).toBeTypeOf('function');
    expect(formatEvaluationCount?.(count)).toBe(expected);
  });
});
