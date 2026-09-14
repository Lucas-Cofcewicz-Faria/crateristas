import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  requireMember: vi.fn(),
  findCatalogRestaurant: vi.fn(),
  listCatalogRestaurants: vi.fn(),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND_TEST'); }),
}));
vi.mock('@/lib/auth/access', () => ({ requireMember: dependencies.requireMember }));
vi.mock('@/features/restaurants/catalog', () => ({
  findCatalogRestaurant: dependencies.findCatalogRestaurant,
  listCatalogRestaurants: dependencies.listCatalogRestaurants,
}));
vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(async () => undefined),
}));
vi.mock('next/navigation', () => ({
  notFound: dependencies.notFound,
  usePathname: () => '/visitas/nova',
  useRouter: () => ({ push: vi.fn() }),
}));

import NewVisitError from './error';
import NewVisitLoading from './loading';
import NewVisitPage from './page';

afterEach(cleanup);

const member: MemberRecord = {
  id: 'member-1',
  authUserId: 'auth-user-1',
  email: 'ana@example.com',
  slug: 'ana',
  displayName: 'Ana',
  avatarUrl: null,
  societyTitle: null,
  memberNumber: 1,
  bio: 'Integrante.',
  favoriteCuisine: null,
  role: 'member',
};

describe('página privada de criação de visita', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.requireMember.mockResolvedValue(member);
    dependencies.findCatalogRestaurant.mockResolvedValue(null);
    dependencies.listCatalogRestaurants.mockResolvedValue([]);
  });

  it('exige membro antes de renderizar o formulário manual', async () => {
    render(await NewVisitPage());

    expect(dependencies.requireMember).toHaveBeenCalledOnce();
    expect(dependencies.listCatalogRestaurants).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Registrar nova visita' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preencher com Google Maps' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do restaurante')).toBeInTheDocument();
  });

  it('carrega somente o restaurante da URL e mantém a escolha fixa', async () => {
    const restaurant = {
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'mesa-conhecida',
      name: 'Mesa Conhecida',
      cuisine: 'Italiana',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: null,
      priceBand: null,
      menuEnabled: false,
    };
    dependencies.findCatalogRestaurant.mockResolvedValue(restaurant);
    dependencies.listCatalogRestaurants.mockResolvedValue([restaurant]);

    render(await NewVisitPage({
      searchParams: Promise.resolve({ restaurante: restaurant.slug }),
    }));

    expect(dependencies.findCatalogRestaurant).toHaveBeenCalledWith(restaurant.slug, true);
    expect(dependencies.listCatalogRestaurants).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Mesa Conhecida' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do restaurante')).not.toBeInTheDocument();
  });

  it('não renderiza o formulário quando a autorização falha', async () => {
    dependencies.requireMember.mockRejectedValue(new Error('Não autorizado'));
    await expect(NewVisitPage()).rejects.toThrow('Não autorizado');
    expect(dependencies.findCatalogRestaurant).not.toHaveBeenCalled();
    expect(dependencies.listCatalogRestaurants).not.toHaveBeenCalled();
  });

  it('não aceita um restaurante inexistente informado na URL', async () => {
    await expect(NewVisitPage({
      searchParams: Promise.resolve({ restaurante: 'nao-existe' }),
    })).rejects.toThrow('NEXT_NOT_FOUND_TEST');
    expect(dependencies.findCatalogRestaurant).toHaveBeenCalledWith('nao-existe', true);
    expect(dependencies.notFound).toHaveBeenCalledOnce();
  });

  it('oferece estados de carregamento e recuperação sem expor o erro', () => {
    const reset = vi.fn();
    const { rerender } = render(<NewVisitLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Preparando o formulário...');

    rerender(<NewVisitError error={new Error('segredo')} reset={reset} />);
    expect(screen.getByRole('heading', { name: 'Não foi possível abrir o formulário.' }))
      .toBeInTheDocument();
    screen.getByRole('button', { name: 'Tentar novamente' }).click();
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.queryByText('segredo')).not.toBeInTheDocument();
  });
});
