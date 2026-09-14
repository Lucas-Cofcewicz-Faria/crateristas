import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MenuCatalog } from './MenuCatalog';
import type { MenuItem } from './menu-types';

const items: MenuItem[] = [
  { id: 'a', slug: 'massa', restaurantId: 'r', name: 'Macarrão sagrado', category: 'Massas', description: '', priceCents: 2400, createdBy: 'm', publicationState: 'published', photos: [], contributions: [] },
  { id: 'b', slug: 'pombo', restaurantId: 'r', name: 'Pombo crocante', category: 'Aves', description: '', priceCents: null, createdBy: 'm', publicationState: 'private', photos: [], contributions: [] },
];
afterEach(cleanup);

describe('MenuCatalog', () => {
  it('oferece Explorar prato dentro do link do card, sem repetir a categoria antes do preço', () => {
    render(<MenuCatalog restaurantSlug="cratera" items={items} />);
    const actions = screen.getAllByText('Explorar prato');
    expect(actions).toHaveLength(2);
    expect(actions[0].closest('a')).toHaveAttribute('href', '/restaurantes/cratera/menu/massa');
    expect(actions[0].closest('a')?.querySelector('button, a')).toBeNull();
    expect(screen.queryByText('Massas')).not.toBeInTheDocument();
    expect(screen.getByText(/R\$\s*24,00/)).toBeInTheDocument();
  });
  it('keeps dish links inside the restaurant menu and distinguishes drafts', () => {
    render(<MenuCatalog restaurantSlug="cratera" items={items} />);
    expect(screen.getByRole('link', { name: /Macarrão sagrado/i })).toHaveAttribute('href', '/restaurantes/cratera/menu/massa');
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });
  it('combines text and category filters and lets the visitor reset an empty result', () => {
    render(<MenuCatalog restaurantSlug="cratera" items={items} />);
    fireEvent.change(screen.getByLabelText('Buscar prato'), { target: { value: 'macarrao' } });
    expect(screen.getByText('Macarrão sagrado')).toBeInTheDocument();
    expect(screen.queryByText('Pombo crocante')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'Aves' } });
    expect(screen.getByText('Nenhum prato encontrado.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText('Pombo crocante')).toBeInTheDocument();
  });
  it('filtra pela categoria preservada mesmo sem exibi-la no card', () => {
    render(<MenuCatalog restaurantSlug="cratera" items={items} />);
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    fireEvent.change(screen.getByRole('textbox', { name: 'Categoria' }), { target: { value: ' MASS ' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(screen.getByText('Macarrão sagrado')).toBeInTheDocument();
    expect(items[0].category).toBe('Massas');
    expect(screen.queryByText('Pombo crocante')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText('Pombo crocante')).toBeInTheDocument();
  });
});
