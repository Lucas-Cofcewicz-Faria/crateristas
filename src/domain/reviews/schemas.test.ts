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

  it('normalizes an optional dish without breaking scorecards that omit it', () => {
    expect(scorecardSchema.parse({
      ...validScores,
      comment: 'Comentário válido.',
      dish: '  Nhoque de mandioquinha  ',
    }).dish).toBe('Nhoque de mandioquinha');
    expect(scorecardSchema.parse({
      ...validScores,
      comment: 'Comentário válido.',
    }).dish).toBeUndefined();
    expect(scorecardSchema.parse({
      ...validScores,
      comment: 'Comentário válido.',
      dish: '   ',
    }).dish).toBeUndefined();
  });

  it('rejects a dish above 80 characters', () => {
    const result = scorecardSchema.safeParse({
      ...validScores,
      comment: 'Comentário válido.',
      dish: 'a'.repeat(81),
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.dish).toEqual([
      'O prato pedido deve ter no máximo 80 caracteres.',
    ]);
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
