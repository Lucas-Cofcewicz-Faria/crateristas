import { describe, expect, it } from 'vitest';
import { aggregateMenuScores, menuScoreSchema } from './menu-scores';

const base = { flavor: 8, value: 6, ux: 10, waitTime: null, rng: null, comment: 'Muito bom.' };
describe('notas dos pratos', () => {
  it('não transforma campos opcionais ausentes em zero', () => {
    expect(aggregateMenuScores([base])).toMatchObject({ overall: 8, waitTime: null, rng: null, waitCount: 0, rngCount: 0 });
  });
  it('preserva zero opcional e calcula denominadores próprios', () => {
    expect(aggregateMenuScores([base, { ...base, waitTime: 0, rng: 0 }])).toMatchObject({ overall: 7, waitTime: 0, rng: 0, waitCount: 1, rngCount: 1 });
  });
  it('RNG aceita porcentagem sem alterar qualidade', () => {
    expect(menuScoreSchema.safeParse({ ...base, rng: 100 }).success).toBe(true);
    expect(aggregateMenuScores([{ ...base, rng: 100 }]).overall).toBe(8);
    expect(menuScoreSchema.safeParse({ ...base, rng: 101 }).success).toBe(false);
    expect(menuScoreSchema.safeParse({ ...base, ux: 11 }).success).toBe(false);
  });
  it('sem contribuições não apresenta nota inventada', () => {
    expect(aggregateMenuScores([])).toMatchObject({ count: 0, overall: null, flavor: null });
  });
});
