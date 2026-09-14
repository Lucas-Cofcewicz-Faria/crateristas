import { beforeEach, describe, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({ member: vi.fn(), admin: vi.fn(), restaurant: vi.fn(), create: vi.fn(), item: vi.fn(), save: vi.fn(), publish: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ requireMember: deps.member, requireAdmin: deps.admin }));
vi.mock('@/features/restaurants/catalog', () => ({ findCatalogRestaurant: deps.restaurant }));
vi.mock('./menu-repository', () => ({ createMenuItem: deps.create, findMenuItem: deps.item, saveMenuScore: deps.save, changeMenuPublication: deps.publish }));
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidate }));
import { publishMenuItemAction, saveMenuReviewAction } from './menu-actions';

function input(extra: Record<string, string> = {}) {
  const form = new FormData();
  Object.entries({ restaurantSlug: 'casa', name: 'Macarrão', category: 'Massas', flavor: '8', value: '7', ux: '9', comment: 'Muito bom.', ...extra }).forEach(([key, value]) => form.set(key, value));
  return form;
}
describe('menu actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deps.member.mockResolvedValue({ id: 'member' }); deps.admin.mockResolvedValue({ id: 'admin' });
    deps.restaurant.mockResolvedValue({ id: 'r', slug: 'casa', menuEnabled: true });
    deps.create.mockResolvedValue({ id: 'dish', slug: 'macarrao' });
    deps.item.mockResolvedValue({ id: 'dish', slug: 'macarrao' }); deps.save.mockResolvedValue(true); deps.publish.mockResolvedValue(true);
  });
  it('creates initial review atomically and preserves omitted scores as null', async () => {
    expect(await saveMenuReviewAction(input())).toEqual({ error: null, itemId: 'dish', href: '/restaurantes/casa/menu/macarrao' });
    expect(deps.create).toHaveBeenCalledWith('member', 'r', expect.objectContaining({ priceCents: null, category: 'Sem categoria' }), expect.objectContaining({ waitTime: null, rng: null }));
  });
  it('accepts creation without a category and ignores a client-supplied category', async () => {
    const form = input();
    form.delete('category');
    expect((await saveMenuReviewAction(form)).error).toBeNull();
    await saveMenuReviewAction(input({ category: 'Categoria inventada' }));
    expect(deps.create).toHaveBeenLastCalledWith('member', 'r', expect.objectContaining({ category: 'Sem categoria' }), expect.anything());
  });
  it('preserves optional zero and percent, rejecting out-of-range or missing required scores', async () => {
    await saveMenuReviewAction(input({ waitTime: '0', rng: '100' }));
    expect(deps.create).toHaveBeenCalledWith('member', 'r', expect.anything(), expect.objectContaining({ waitTime: 0, rng: 100 }));
    deps.create.mockClear();
    expect((await saveMenuReviewAction(input({ rng: '101' }))).error).toBeTruthy();
    const missing = input(); missing.delete('flavor');
    expect((await saveMenuReviewAction(missing)).error).toBeTruthy();
    expect(deps.create).not.toHaveBeenCalled();
  });
  it('only writes the authenticated member contribution to a scoped existing dish', async () => {
    await saveMenuReviewAction(input({ itemSlug: 'macarrao', memberId: 'forged' }));
    expect(deps.item).toHaveBeenCalledWith('r', 'macarrao', true);
    expect(deps.save).toHaveBeenCalledWith('member', 'r', 'dish', expect.anything());
    expect(deps.create).not.toHaveBeenCalled();
  });
  it('denies publishing without admin and writes no data when membership fails', async () => {
    deps.admin.mockRejectedValue(new Error('Forbidden'));
    expect((await publishMenuItemAction(input({ itemSlug: 'macarrao', command: 'publish' }))).error).toBeTruthy();
    expect(deps.publish).not.toHaveBeenCalled();
    deps.member.mockRejectedValue(new Error('Unauthorized'));
    expect((await saveMenuReviewAction(input())).error).toBeTruthy();
    expect(deps.create).not.toHaveBeenCalled();
  });
  it('publishes and hides explicitly, invalidating menu and detail', async () => {
    for (const command of ['publish', 'hide']) {
      expect(await publishMenuItemAction(input({ itemSlug: 'macarrao', command }))).toEqual({ error: null });
      expect(deps.publish).toHaveBeenLastCalledWith('admin', 'r', 'dish', command === 'publish');
    }
    expect(deps.revalidate).toHaveBeenCalledWith('/restaurantes/casa/menu');
    expect(deps.revalidate).toHaveBeenCalledWith('/restaurantes/casa/menu/macarrao');
  });
});
