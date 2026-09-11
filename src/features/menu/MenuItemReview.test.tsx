import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MenuItemReview } from './MenuItemReview';
import type { MenuItem } from './menu-types';

afterEach(cleanup);

const item: MenuItem = {
  id: 'a', slug: 'massa', restaurantId: 'r', name: 'Macarrão sagrado', category: 'Massas',
  description: '', priceCents: 2400, createdBy: 'm', publicationState: 'published', photos: [],
  contributions: [{ memberId: 'm', displayName: 'Ana', avatarUrl: null, flavor: 8, value: 6, ux: 7, waitTime: null, rng: null, comment: 'Vale a visita.' }],
};

describe('MenuItemReview', () => {
  it('omits absent RNG while preserving unassessed quality metrics and the actual mean', () => {
    render(<MenuItemReview item={item} restaurantSlug="cratera" canContribute={false} />);
    expect(screen.queryAllByText(/RNG/)).toHaveLength(0);
    const collective = screen.getByRole('region', { name: 'Avaliação coletiva' });
    expect(within(collective).getByRole('img', { name: 'Avaliação coletiva: 7,0 de 10' })).toBeInTheDocument();
    expect(within(collective).getByText('Tempo de espera').nextElementSibling).toHaveTextContent('Não avaliado');
    expect(screen.getByText(/R\$\s*24,00/)).toBeInTheDocument();
    expect(screen.queryByText('Massas')).not.toBeInTheDocument();
    expect(screen.queryByText('Nota do prato')).not.toBeInTheDocument();
  });

  it('mantém RNG zero visível sem explicações', () => {
    render(<MenuItemReview item={{ ...item, contributions: [{ ...item.contributions[0], rng: 0 }] }} restaurantSlug="cratera" canContribute={false} />);
    const collective = screen.getByRole('region', { name: 'Avaliação coletiva' });
    expect(within(collective).getByText('RNG')).toBeInTheDocument();
    expect(within(collective).getByText('0%')).toBeInTheDocument();
    expect(within(collective).queryByText(/chance|todos vêm|Quanto maior|Não entra/)).not.toBeInTheDocument();
    expect(within(collective).getByRole('img', { name: 'Avaliação coletiva: 7,0 de 10' })).toBeInTheDocument();
  });

  it('preserva RNG 100% sem inverter o valor salvo nem alterar a média geral', () => {
    render(<MenuItemReview item={{ ...item, contributions: [{ ...item.contributions[0], rng: 100 }] }} restaurantSlug="cratera" canContribute={false} />);
    const collective = screen.getByRole('region', { name: 'Avaliação coletiva' });
    expect(within(collective).getByText('RNG')).toBeInTheDocument();
    expect(within(collective).getByText('100%')).toBeInTheDocument();
    expect(within(collective).getByRole('img', { name: 'Avaliação coletiva: 7,0 de 10' })).toBeInTheDocument();
  });
});
