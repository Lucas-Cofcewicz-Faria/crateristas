import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecentRestaurantsCarousel } from './RecentRestaurantsCarousel';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

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
  it('usa a mesma ficha clicável dos registros com cor da capa e nota sem rótulo', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray([0, 180, 0, 255]) }),
    } as unknown as CanvasRenderingContext2D);
    render(<RecentRestaurantsCarousel records={[{ ...record('1', 'A Cantina'), coverPhotoUrl: '/images/cratera.png' }]} />);
    const card = screen.getByRole('article', { name: 'Registro de A Cantina' });
    const link = within(card).getByRole('link', { name: 'Abrir registro de A Cantina' });
    expect(link).toContainElement(within(card).getByRole('heading', { name: 'A Cantina' }));
    const photo = within(link).getByRole('img', { name: /Foto de A Cantina/ });
    expect(within(link).getByRole('img', { name: 'Avaliação coletiva: 8,3 de 10' })).toHaveTextContent('8,3');
    expect(within(card).queryByText('Nota coletiva')).not.toBeInTheDocument();
    fireEvent.load(photo);
    expect(card.style.getPropertyValue('--record-accent')).toBe('hsl(120 72% 68%)');
  });
  it('transfere o foco visual entre cards já montados', async () => {
    const user = userEvent.setup();
    render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B')]} />);
    expect(screen.getByRole('article', { name: 'Registro de A' }).closest('[data-carousel-state]'))
      .toHaveAttribute('data-carousel-state', 'active');
    await user.click(screen.getByRole('button', { name: 'Próximo restaurante' }));
    expect(screen.getByRole('article', { name: 'Registro de B' }).closest('[data-carousel-state]'))
      .toHaveAttribute('data-carousel-state', 'active');
  });

  it('mantém a ficha inteira navegável mesmo sem fotografia', () => {
    render(<RecentRestaurantsCarousel records={[record('1', 'A Cantina')]} />);

    expect(screen.getByRole('link', { name: 'Abrir registro de A Cantina' }))
      .toHaveAttribute('href', '/restaurantes/restaurante-1');
    expect(screen.queryByRole('link', { name: 'Abrir registro' })).not.toBeInTheDocument();
  });

  it('mantém as fichas montadas para animar escala e posição sem recriar os cards', async () => {
    const user = userEvent.setup();
    render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B')]} />);

    const firstSlide = screen.getByRole('article', { name: 'Registro de A' });
    const nextSlide = screen.getByRole('heading', { name: 'B', hidden: true }).closest('article');
    await user.click(screen.getByRole('button', { name: 'Próximo restaurante' }));

    const secondSlide = screen.getByRole('article', { name: 'Registro de B' });
    expect(secondSlide).toBe(nextSlide);
    expect(firstSlide).toBeInTheDocument();
    expect(firstSlide.closest('[data-carousel-state]')).toHaveAttribute('data-carousel-state', 'previous');
    expect(firstSlide.parentElement).toHaveAttribute('inert');
    expect(secondSlide.parentElement).not.toHaveAttribute('inert');
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

  it('ativa o card lateral sem navegar e mantém o foco de teclado fora do card inativo', () => {
    const { container } = render(<RecentRestaurantsCarousel records={[record('1', 'A'), record('2', 'B'), record('3', 'C')]} />);
    fireEvent.click(container.querySelector('[data-carousel-state="next"] button')!);
    const link = screen.getByRole('link', { name: 'Abrir registro de B' });
    link.focus();
    fireEvent.keyDown(link, { key: 'ArrowRight' });
    expect(screen.getByRole('region', { name: 'Restaurantes publicados recentemente' })).toHaveFocus();
    expect(screen.getByRole('article', { name: 'Registro de C' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir registro de B' })).not.toBeInTheDocument();
  });
});
