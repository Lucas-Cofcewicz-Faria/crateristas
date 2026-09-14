import { beforeEach, describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db', () => ({ getDb: () => ({ query }) }));

import { findCatalogRestaurant, listRestaurantVisits } from './catalog';

describe('catálogo de restaurantes visível por sessão', () => {
  beforeEach(() => query.mockReset());

  it('uses the active member id to include saved private visits', async () => {
    query
      .mockResolvedValueOnce([{ id: 'restaurant-1', slug: 'casa', name: 'Casa', cuisine: 'Teste', neighborhood: 'Centro', city: 'São Paulo', address: null, price_band: null, menu_enabled: false }])
      .mockResolvedValueOnce([{ id: 'visit-1', slug: 'visita-privada', visited_at: '2026-09-10' }]);

    await findCatalogRestaurant('casa', 'member-1');
    const visits = await listRestaurantVisits('restaurant-1', 'member-1');

    expect(query.mock.calls[0][0]).toContain('viewer.removed_at IS NULL');
    expect(query.mock.calls[0][1]).toEqual(['casa', 'member-1']);
    expect(query.mock.calls[1][0]).toContain('FROM scorecards visible_score');
    expect(query.mock.calls[1][1]).toEqual(['restaurant-1', 'member-1']);
    expect(visits).toEqual([{ id: 'visit-1', slug: 'visita-privada', visitedAt: '2026-09-10' }]);
  });
});
