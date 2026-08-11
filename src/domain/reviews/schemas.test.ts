import { describe, expect, it } from 'vitest';
import { publicVisitFiltersSchema, scorecardSchema } from './schemas';

const validScores = {
  food: 0,
  service: 2,
  ambience: 4,
  value: 6,
  access: 8,
  waitTime: 10,
};

describe('scorecardSchema', () => {
  it.each([-1, 10.5, 11])('rejects the invalid integer score %s', (food) => {
    expect(scorecardSchema.safeParse({ ...validScores, food, comment: 'Comentário válido.' }).success).toBe(false);
  });

  it('rejects a comment with 181 characters', () => {
    expect(scorecardSchema.safeParse({ ...validScores, comment: 'a'.repeat(181) }).success).toBe(false);
  });

  it('accepts six valid scores and a 180-character comment', () => {
    expect(scorecardSchema.safeParse({ ...validScores, comment: 'a'.repeat(180) }).success).toBe(true);
  });
});

describe('publicVisitFiltersSchema', () => {
  it('uses the first repeated value, trims it, and removes unknown keys', () => {
    expect(publicVisitFiltersSchema.parse({
      busca: ['  Casa Cratera  ', 'Ignorado'],
      culinaria: '  Brasileira ',
      bairro: '  Pinheiros  ',
      inesperado: 'não deve sair',
    })).toEqual({ busca: 'Casa Cratera', culinaria: 'Brasileira', bairro: 'Pinheiros' });
  });

  it('normalizes blank filters to undefined', () => {
    expect(publicVisitFiltersSchema.parse({ busca: '   ', culinaria: '', bairro: [' '] })).toEqual({
      busca: undefined,
      culinaria: undefined,
      bairro: undefined,
    });
  });

  it.each([
    ['busca', 161],
    ['culinaria', 101],
    ['bairro', 121],
  ] as const)('rejects %s above its maximum length', (key, length) => {
    expect(() => publicVisitFiltersSchema.parse({ [key]: 'a'.repeat(length) })).toThrow();
  });
});
