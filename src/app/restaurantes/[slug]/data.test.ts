import { beforeEach, describe, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({ restaurant: vi.fn(), visits: vi.fn(), detail: vi.fn() }));
vi.mock('@/features/restaurants/catalog', () => ({ findCatalogRestaurant: deps.restaurant, listRestaurantVisits: deps.visits }));
vi.mock('@/lib/reviews/server', () => ({ getReviewRepository: () => ({ getPublicVisitBySlug: deps.detail }) }));
import { getRestaurantVisitPage } from './data';

describe('restaurant visit selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.restaurant.mockResolvedValue({ id: 'r', slug: 'canonical' });
    deps.visits.mockResolvedValue([{ id: 'new', slug: 'new-visit', visitedAt: '2026-09-09' }, { id: 'old', slug: 'old-visit', visitedAt: '2026-08-01' }]);
    deps.detail.mockImplementation(async (slug) => ({ slug }));
  });
  it('defaults even a legacy visit URL to the latest published restaurant visit', async () => {
    expect((await getRestaurantVisitPage('legacy-url'))?.visit.slug).toBe('new-visit');
  });
  it('selects an older published date when requested', async () => {
    expect((await getRestaurantVisitPage('canonical', 'old'))?.visit.slug).toBe('old-visit');
  });
  it('never fetches a private or foreign visit ID absent from the scoped public list', async () => {
    expect(await getRestaurantVisitPage('canonical', 'foreign-or-private')).toBeNull();
    expect(deps.detail).not.toHaveBeenCalled();
  });
});
