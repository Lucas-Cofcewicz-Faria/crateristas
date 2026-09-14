import { describe, expect, it } from 'vitest';
import { createNeonReviewRepository, type ReviewSqlClient } from './neon-review-repository';

const summaryRow = {
  id: 'private-visit', slug: 'visita-salva', publication_state: 'private',
  restaurant_slug: 'restaurante-salvo', restaurant_name: 'Restaurante Salvo',
  cuisine: 'Brasileira', neighborhood: 'Centro', city: 'São Paulo',
  address: null, price_band: '$$', visited_at: '2026-09-10', published_at: null,
  participant_count: 1, average_food: 8, average_service: 7,
  average_ambience: 9, average_value: 6, average_access: 5,
  average_wait_time: 8, overall: 7.2, cover_photo_url: null,
};

describe('member-visible visit projections', () => {
  it('lists scored private visits for an active member', async () => {
    let capturedSql = '';
    let capturedParams: unknown[] = [];
    const sql = {
      query: async (text: string, params: unknown[]) => {
        capturedSql = text;
        capturedParams = params;
        return [summaryRow];
      },
      transaction: async () => { throw new Error('A listagem não deve abrir transação.'); },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const result = await repository.listMemberVisibleVisits('member-1', {});

    expect(capturedParams).toEqual([null, null, null, 'member-1']);
    expect(capturedSql).toContain('viewer.removed_at IS NULL');
    expect(capturedSql).toContain('FROM scorecards visible_score');
    expect(result[0]).toMatchObject({ slug: 'visita-salva', publicationState: 'private' });
  });

  it('returns a private visit detail only through an active member projection', async () => {
    let capturedSql = '';
    let capturedParams: unknown[] = [];
    const sql = {
      query: async (text: string, params: unknown[]) => {
        capturedSql = text;
        capturedParams = params;
        return [{ ...summaryRow, photos: [], comments: [], legacy_review_id: null, legacy_payload: null }];
      },
      transaction: async () => { throw new Error('A consulta não deve abrir transação.'); },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const result = await repository.getMemberVisibleVisitBySlug('visita-salva', 'member-1');

    expect(capturedParams).toEqual(['visita-salva', 'member-1']);
    expect(capturedSql).toContain('viewer.removed_at IS NULL');
    expect(result).toMatchObject({ slug: 'visita-salva', publicationState: 'private' });
  });
});
