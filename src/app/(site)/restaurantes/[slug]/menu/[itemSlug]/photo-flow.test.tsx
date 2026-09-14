import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({ member: vi.fn(), context: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ requireMember: deps.member }));
vi.mock('../data', () => ({ getMenuItemContext: deps.context }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/features/menu/menu-actions', () => ({ saveMenuReviewAction: vi.fn(), publishMenuItemAction: vi.fn() }));
vi.mock('@/components/shell/PublicShell', () => ({ PublicShell: ({ children }: { children: ReactNode }) => children }));

import ReviewMenuItemPage from './avaliar/page';
import MenuItemPage from './page';

const params = Promise.resolve({ slug: 'casa', itemSlug: 'ramen' });
const dish = {
  id: 'dish-1', slug: 'ramen', restaurantId: 'r-1', name: 'Rámen', category: 'Lámens',
  description: '', priceCents: null, createdBy: 'owner', publicationState: 'private',
  photos: [], contributions: [],
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  deps.context.mockResolvedValue({
    restaurant: { id: 'r-1', slug: 'casa', name: 'Casa', menuEnabled: true },
    coverUrl: null, item: dish, member: { id: 'owner', role: 'member' },
  });
});

describe('photo permissions and placement', () => {
  it.each([{ id: 'owner', role: 'member' }, { id: 'administrator', role: 'admin' }])('offers photos in the review route for $role $id', async (actor) => {
    deps.member.mockResolvedValue(actor);
    render(await ReviewMenuItemPage({ params }));
    expect(screen.getByLabelText('Selecionar foto')).toBeInTheDocument();
  });

  it('lets another member review without offering photo management', async () => {
    deps.member.mockResolvedValue({ id: 'other', role: 'member' });
    render(await ReviewMenuItemPage({ params }));
    expect(screen.getByRole('button', { name: 'Salvar minha avaliação' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Selecionar foto')).not.toBeInTheDocument();
  });

  it('does not offer uploads on the dish detail even to its creator', async () => {
    render(await MenuItemPage({ params }));
    expect(screen.getByRole('heading', { name: 'Rámen' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Selecionar foto')).not.toBeInTheDocument();
  });
});
