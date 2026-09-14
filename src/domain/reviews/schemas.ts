import { z } from 'zod';
import type { PublicVisitFilters } from './types';

const scoreSchema = z.number({ error: 'A nota deve ser um número.' })
  .int('A nota deve ser um número inteiro.')
  .min(0, 'A nota mínima é 0.')
  .max(10, 'A nota máxima é 10.');

const requiredText = (field: string, maximum: number) => z.string({ error: `${field} deve ser um texto.` })
  .trim()
  .min(1, `${field} é obrigatório.`)
  .max(maximum, `${field} deve ter no máximo ${maximum} caracteres.`);

const optionalText = (field: string, maximum: number) => z.string({ error: `${field} deve ser um texto.` })
  .trim()
  .max(maximum, `${field} deve ter no máximo ${maximum} caracteres.`)
  .transform((value) => value || undefined)
  .optional();

export const createVisitSchema = z.object({
  restaurantId: z.uuid().optional(),
  menuEnabled: z.boolean().optional(),
  restaurantName: requiredText('O nome do restaurante', 160),
  cuisine: requiredText('A culinária', 100),
  neighborhood: requiredText('O bairro', 120),
  city: requiredText('A cidade', 120),
  address: optionalText('O endereço', 300),
  priceBand: z.enum(['$', '$$', '$$$', '$$$$'], { error: 'A faixa de preço é inválida.' }).optional(),
  visitedAt: z.string({ error: 'A data da visita deve ser um texto.' })
    .date('A data da visita deve estar no formato AAAA-MM-DD.'),
});

export const scorecardSchema = z.object({
  food: scoreSchema,
  service: scoreSchema,
  ambience: scoreSchema,
  value: scoreSchema,
  access: scoreSchema,
  waitTime: scoreSchema,
  dish: optionalText('O prato pedido', 80),
  comment: z.string({ error: 'O comentário deve ser um texto.' })
    .trim()
    .min(1, 'O comentário é obrigatório.')
    .max(180, 'O comentário deve ter no máximo 180 caracteres.'),
});

export const publicationCommandSchema = z.enum(['publish_early', 'hide', 'republish'], {
  error: 'O comando de publicação é inválido.',
});

const publicFilter = (field: string, maximum: number) => z.preprocess(
  (value) => Array.isArray(value) ? value[0] : value,
  z.string({ error: `${field} deve ser um texto.` })
    .trim()
    .max(maximum, `${field} deve ter no máximo ${maximum} caracteres.`)
    .transform((value) => value || undefined)
    .optional(),
);

export const publicVisitFiltersSchema: z.ZodType<PublicVisitFilters> = z.object({
  busca: publicFilter('A busca', 160),
  culinaria: publicFilter('A culinária', 100),
  bairro: publicFilter('O bairro', 120),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type ScorecardInput = z.infer<typeof scorecardSchema>;
