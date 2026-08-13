import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

import { CreateVisitForm } from './CreateVisitForm';

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
    });
    expect(navigation.push).toHaveBeenCalledWith(
      '/visitas/11111111-1111-4111-8111-111111111111/avaliar',
    );
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
