import { cleanup, render, screen } from '@testing-library/react';
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
      id: 'visit-42',
      slug: 'mesa-manual-2026-08-10',
      publicationState: 'private',
    }), { status: 201, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CreateVisitForm />);

    await user.type(screen.getByLabelText('Nome do restaurante'), 'Mesa Manual');
    await user.type(screen.getByLabelText('Culinária'), 'Brasileira');
    await user.type(screen.getByLabelText('Bairro'), 'Centro');
    await user.type(screen.getByLabelText('Cidade'), 'São Paulo');
    await user.type(screen.getByLabelText('Endereço (opcional)'), 'Rua da Cratera, 8');
    await user.selectOptions(screen.getByLabelText('Faixa de preço (opcional)'), '$$');
    await user.type(screen.getByLabelText('Data da visita'), '2026-08-10');
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
    expect(navigation.push).toHaveBeenCalledWith('/visitas/visit-42/avaliar');
  });

  it('preserva todos os campos e mostra erro genérico quando a criação falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'detalhe-interno',
    }), { status: 500, headers: { 'content-type': 'application/json' } })));
    const user = userEvent.setup();
    render(<CreateVisitForm />);

    const name = screen.getByLabelText('Nome do restaurante');
    await user.type(name, 'Mesa Persistente');
    await user.type(screen.getByLabelText('Culinária'), 'Italiana');
    await user.type(screen.getByLabelText('Bairro'), 'Pinheiros');
    await user.type(screen.getByLabelText('Cidade'), 'São Paulo');
    await user.type(screen.getByLabelText('Data da visita'), '2026-08-11');
    await user.click(screen.getByRole('button', { name: 'Criar visita' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível criar a visita. Tente novamente.',
    );
    expect(screen.queryByText('detalhe-interno')).not.toBeInTheDocument();
    expect(name).toHaveValue('Mesa Persistente');
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
