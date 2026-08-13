import { describe, expect, it } from 'vitest';
import { createNeonReviewRepository, type ReviewSqlClient } from './neon-review-repository';

describe('projeção privada da avaliação', () => {
  it('retorna somente a ficha do membro atual, fotos ordenadas e dados coletivos estreitos', async () => {
    let capturedText = '';
    let capturedParams: unknown[] = [];
    const sql = {
      query: async (text: string, params: unknown[]) => {
        capturedText = text;
        capturedParams = params;
        return [{
          id: 'visit-1',
          restaurant_name: 'Mesa Segura',
          cuisine: 'Brasileira',
          neighborhood: 'Centro',
          city: 'São Paulo',
          visited_at: '2026-08-10',
          participant_count: 2,
          quorum: 6,
          publication_state: 'private',
          created_by: 'member-creator',
          own_food: 8,
          own_service: 7,
          own_ambience: 9,
          own_value: 6,
          own_access: 5,
          own_wait_time: 4,
          own_comment: 'Minha contribuição.',
          photos: [
            { id: 'photo-1', url: 'https://blob.example/one.webp', position: 1 },
            { id: 'photo-2', url: 'https://blob.example/two.webp', position: 2 },
          ],
          other_member_id: 'member-2',
          other_food: 1,
          email: 'segredo@example.com',
          auth_user_id: 'auth-secreto',
        }];
      },
      transaction: async () => {
        throw new Error('A projeção não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;

    const repository = createNeonReviewRepository(sql);
    const result = await repository.getVisitReviewWorkspace('visit-1', 'member-1');

    expect(capturedParams).toEqual(['visit-1', 'member-1']);
    expect(capturedText).toContain('own.member_id = $2');
    expect(capturedText).toContain('ORDER BY p.position');
    expect(result).toEqual({
      id: 'visit-1',
      restaurantName: 'Mesa Segura',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      visitedAt: '2026-08-10',
      participantCount: 2,
      quorum: 6,
      publicationState: 'private',
      createdBy: 'member-creator',
      ownScorecard: {
        food: 8,
        service: 7,
        ambience: 9,
        value: 6,
        access: 5,
        waitTime: 4,
        comment: 'Minha contribuição.',
      },
      photos: [
        { id: 'photo-1', url: 'https://blob.example/one.webp', position: 1 },
        { id: 'photo-2', url: 'https://blob.example/two.webp', position: 2 },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('member-2');
    expect(JSON.stringify(result)).not.toContain('segredo@example.com');
    expect(JSON.stringify(result)).not.toContain('auth-secreto');
  });
});
