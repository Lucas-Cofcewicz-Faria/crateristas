import { beforeEach, describe, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({ member: vi.fn(), restaurant: vi.fn(), cover: vi.fn(), item: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ findOptionalMember: deps.member }));
vi.mock('@/features/restaurants/catalog', () => ({ findCatalogRestaurant: deps.restaurant, getRestaurantCover: deps.cover }));
vi.mock('@/features/menu/menu-repository', () => ({ findMenuItem: deps.item }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
import { getMenuItemContext } from './data';

describe('menu route access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.member.mockResolvedValue(null);
    deps.restaurant.mockResolvedValue({ id: 'restaurant-1', menuEnabled: true });
    deps.cover.mockResolvedValue(null);
    deps.item.mockResolvedValue({ id: 'dish' });
  });
  it('scopes a public item to its restaurant and published-only queries', async () => {
    await getMenuItemContext('restaurante', 'prato');
    expect(deps.restaurant).toHaveBeenCalledWith('restaurante', false);
    expect(deps.item).toHaveBeenCalledWith('restaurant-1', 'prato', false);
  });
  it('lets active members see drafts but still scopes the restaurant', async () => {
    deps.member.mockResolvedValue({ id: 'member' });
    await getMenuItemContext('restaurante', 'prato');
    expect(deps.item).toHaveBeenCalledWith('restaurant-1', 'prato', true);
  });
  it('does not expose disabled menus or unavailable dishes', async () => {
    deps.restaurant.mockResolvedValueOnce({ id: 'restaurant-1', menuEnabled: false });
    await expect(getMenuItemContext('restaurante', 'prato')).rejects.toThrow('NOT_FOUND');
    expect(deps.item).not.toHaveBeenCalled();
    deps.item.mockResolvedValueOnce(null);
    await expect(getMenuItemContext('restaurante', 'hidden')).rejects.toThrow('NOT_FOUND');
  });
});
