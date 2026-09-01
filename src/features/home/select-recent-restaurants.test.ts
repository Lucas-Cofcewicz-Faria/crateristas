import { describe, expect, it } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { selectRecentRestaurants } from './select-recent-restaurants';

function visit(id: string, restaurantSlug: string): PublicVisitSummary {
  return {
    id,
    slug: `visita-${id}`,
    restaurant: {
      slug: restaurantSlug,
      name: restaurantSlug,
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: null,
      priceBand: null,
    },
    visitedAt: '2026-08-30',
    publishedAt: '2026-08-31T12:00:00.000Z',
    coverPhotoUrl: null,
    participantCount: 6,
    averages: null,
    overall: 8,
  };
}

describe('selectRecentRestaurants', () => {
  it('preserva a ordem do repositório, mantém a visita mais recente de cada restaurante e não muta a entrada', () => {
    const records = [visit('1', 'a'), visit('2', 'a'), visit('3', 'b')];
    const snapshot = [...records];

    expect(selectRecentRestaurants(records).map((record) => record.id)).toEqual(['1', '3']);
    expect(records).toEqual(snapshot);
  });

  it('limita a seleção ao máximo editorial de seis restaurantes', () => {
    const records = Array.from({ length: 8 }, (_, index) => visit(String(index), `r-${index}`));

    expect(selectRecentRestaurants(records)).toHaveLength(6);
  });
});
