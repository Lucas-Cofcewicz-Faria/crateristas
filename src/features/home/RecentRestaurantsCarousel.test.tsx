import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecentRestaurantsCarousel } from './RecentRestaurantsCarousel';

afterEach(cleanup);

function record(id: string, name: string): PublicVisitSummary {
  return {
    id,
    slug: `registro-${id}`,
    restaurant: {
      slug: `restaurante-${id}`,
      name,
      cuisine: 'Italiana',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      address: null,
      priceBand: '$$',
    },
    visitedAt: '2026-08-30',
    publishedAt: '2026-08-31T12:00:00.000Z',
    coverPhotoUrl: null,
    participantCount: 6,
    averages: null,
    overall: 8.3,
  };
}

describe('RecentRestaurantsCarousel', () => {
  it('usa o nome como link principal do registro mesmo sem fotografia', () => {
    render(<RecentRestaurantsCarousel records={[record('1', 'A Cantina')]} />);

    expect(screen.getByRole('link', { name: 'A Cantina' }))
      .toHaveAttribute('href', '/restaurantes/registro-1');
    expect(screen.queryByRole('link', { name: 'Abrir registro' })).not.toBeInTheDocument();
  });

  it('monta uma nova ficha quando o visitante troca o restaurante manualmente', async () => {
    const user = userEvent.setup();
    render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B')]} />);

    const firstSlide = screen.getByRole('article', { name: 'Registro de A' });
    await user.click(screen.getByRole('button', { name: 'Próximo restaurante' }));

    const secondSlide = screen.getByRole('article', { name: 'Registro de B' });
    expect(secondSlide).not.toBe(firstSlide);
    expect(firstSlide).not.toBeInTheDocument();
  });

  it('navega por botões, teclado e indicadores sem ultrapassar as extremidades', async () => {
    const user = userEvent.setup();
    render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B'), record('3', 'C')]} />);

    const region = screen.getByRole('region', { name: 'Restaurantes publicados recentemente' });
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurante anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próximo restaurante' }));
    expect(screen.getByRole('heading', { name: 'B' })).toBeInTheDocument();

    region.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { name: 'C' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próximo restaurante' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Mostrar restaurante 1: A' }));
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mostrar restaurante 1: A' }))
      .toHaveAttribute('aria-current', 'true');
  });

  it('mostra estado vazio honesto sem fabricar slides', () => {
    render(<RecentRestaurantsCarousel records={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('Os registros ainda estão em silêncio');
    expect(screen.getByRole('link', { name: 'Consultar o livro de registros' }))
      .toHaveAttribute('href', '/registros');
    expect(screen.queryByRole('button', { name: 'Próximo restaurante' })).not.toBeInTheDocument();
  });
});
