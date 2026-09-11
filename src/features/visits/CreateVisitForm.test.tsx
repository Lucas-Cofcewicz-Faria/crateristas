import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

import { CreateVisitForm } from './CreateVisitForm';

const catalogRestaurant = {
  id: '22222222-2222-4222-8222-222222222222',
  slug: 'mesa-conhecida',
  name: 'Mesa Conhecida',
  cuisine: 'Italiana',
  neighborhood: 'Centro',
  city: 'São Paulo',
  address: null,
  priceBand: null,
  menuEnabled: true,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('criação manual de visita', () => {
  beforeEach(() => navigation.push.mockReset());

  it('envia os campos do domínio e navega para a avaliação retornada pela API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'mesa-manual-2026-08-10',
      publicationState: 'private',
    }), { status: 201, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CreateVisitForm />);

    fireEvent.change(screen.getByLabelText('Nome do restaurante'), {
      target: { value: 'Mesa Manual' },
    });
    fireEvent.change(screen.getByLabelText('Culinária'), { target: { value: 'Brasileira' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Centro' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByLabelText('Endereço (opcional)'), {
      target: { value: 'Rua da Cratera, 8' },
    });
    await user.selectOptions(screen.getByLabelText('Faixa de preço (opcional)'), '$$');
    fireEvent.change(screen.getByLabelText('Data da visita'), {
      target: { value: '2026-08-10' },
    });
    await user.click(screen.getByRole('button', { name: 'Criar visita' }));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/visits', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }));
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(requestInit.body))).toEqual({
      restaurantName: 'Mesa Manual',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: 'Rua da Cratera, 8',
      priceBand: '$$',
      visitedAt: '2026-08-10',
      menuEnabled: false,
    });
    expect(navigation.push).toHaveBeenCalledWith(
      '/visitas/11111111-1111-4111-8111-111111111111/avaliar',
    );
  });

  it('prefill de restaurante cria outra visita sem recadastrar seus dados e preserva o menu', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'new-visit' }), {
      status: 201, headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CreateVisitForm restaurant={catalogRestaurant} />);

    expect(screen.getByRole('heading', { name: 'Mesa Conhecida' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do restaurante')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Incluir menu de pratos')).toBeChecked();
    expect(screen.getByLabelText('Incluir menu de pratos')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Data da visita'), { target: { value: '2026-09-09' } });
    await user.click(screen.getByRole('button', { name: 'Criar visita' }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      restaurantId: catalogRestaurant.id,
      restaurantName: catalogRestaurant.name,
      cuisine: catalogRestaurant.cuisine,
      neighborhood: catalogRestaurant.neighborhood,
      city: catalogRestaurant.city,
      visitedAt: '2026-09-09',
      menuEnabled: true,
    });
  });

  it('cadastra um novo restaurante e permite habilitar o menu opcional na entrada genérica', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'new-visit' }), {
      status: 201, headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CreateVisitForm />);
    fireEvent.change(screen.getByLabelText('Nome do restaurante'), { target: { value: 'Novo lugar' } });
    expect(screen.queryByLabelText('Restaurante')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome do restaurante')).toHaveValue('Novo lugar');
    const menu = screen.getByLabelText('Incluir menu de pratos');
    expect(menu).not.toBeChecked();
    await user.click(menu);
    expect(menu).toBeChecked();
    fireEvent.change(screen.getByLabelText('Culinária'), { target: { value: 'Contemporânea' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Centro' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByLabelText('Data da visita'), { target: { value: '2026-09-10' } });
    await user.click(screen.getByRole('button', { name: 'Criar visita' }));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      restaurantName: 'Novo lugar',
      cuisine: 'Contemporânea',
      neighborhood: 'Centro',
      city: 'São Paulo',
      visitedAt: '2026-09-10',
      menuEnabled: true,
    });
  });

  it('preserva todos os campos e mostra erro genérico quando a criação falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'detalhe-interno',
    }), { status: 500, headers: { 'content-type': 'application/json' } })));
    const user = userEvent.setup();
    render(<CreateVisitForm />);

    const name = screen.getByLabelText('Nome do restaurante');
    fireEvent.change(name, { target: { value: 'Mesa Persistente' } });
    fireEvent.change(screen.getByLabelText('Culinária'), { target: { value: 'Italiana' } });
    fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Pinheiros' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByLabelText('Data da visita'), {
      target: { value: '2026-08-11' },
    });
    await user.click(screen.getByRole('button', { name: 'Criar visita' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível criar a visita. Tente novamente.',
    );
    expect(screen.queryByText('detalhe-interno')).not.toBeInTheDocument();
    expect(name).toHaveValue('Mesa Persistente');
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
