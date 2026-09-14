import { z } from 'zod';
import type { MenuScore } from './menu-types';

const score = z.number().int().min(0).max(10);
export const menuScoreSchema = z.object({
  flavor: score, value: score, ux: score,
  waitTime: score.nullable(),
  rng: z.number().int().min(0).max(100).nullable(),
  comment: z.string().trim().min(1, 'Escreva um comentário.').max(180),
});
export const menuItemSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do prato.').max(160),
  category: z.string().trim().min(1, 'Informe uma categoria.').max(80),
  description: z.string().trim().max(500),
  priceCents: z.number().int().min(0).max(100000000).nullable(),
});

const rounded = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;
function average(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length ? rounded(present.reduce((sum, value) => sum + value, 0) / present.length) : null;
}
export function aggregateMenuScores(scores: MenuScore[]) {
  return {
    count: scores.length,
    flavor: average(scores.map((score) => score.flavor)),
    value: average(scores.map((score) => score.value)),
    ux: average(scores.map((score) => score.ux)),
    waitTime: average(scores.map((score) => score.waitTime)),
    rng: average(scores.map((score) => score.rng)),
    waitCount: scores.filter((score) => score.waitTime !== null).length,
    rngCount: scores.filter((score) => score.rng !== null).length,
    // Optional absence isn't a zero; higher RNG means more unpredictability (worse), averaged separately.
    overall: average(scores.map((score) => (
      (score.flavor + score.value + score.ux + (score.waitTime ?? 0)) / (score.waitTime === null ? 3 : 4)
    ))),
  };
}
