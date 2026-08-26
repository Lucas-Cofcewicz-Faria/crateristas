import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ScorecardInput } from '@/domain/reviews/schemas';
import { ScorecardForm } from './ScorecardForm';

const existing: ScorecardInput = {
  food: 8,
  service: 7,
  ambience: 9,
  value: 6,
  access: 5,
  waitTime: 4,
  dish: 'Risoto de cogumelos',
  comment: 'Minha contribuição anterior.',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ficha acessível de avaliação', () => {
  it('oferece seis controles nativos com rótulo, número e descrição e preenche só a ficha própria', () => {
    render(<ScorecardForm initialValues={existing} visitId="visit-1" />);

    const expectations = [
      ['Comida', '8'],
      ['Serviço', '7'],
      ['Ambiente', '9'],
      ['Custo-benefício', '6'],
      ['Acesso/localização', '5'],
      ['Tempo de espera', '4'],
    ];
    for (const [label, value] of expectations) {
      const slider = screen.getByRole('slider', { name: label });
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '10');
      expect(slider).toHaveAttribute('step', '1');
      expect(slider).toHaveValue(value);
      expect(slider).toHaveAccessibleDescription();
      expect(screen.getByText(`${value} de 10`, { selector: 'output' })).toBeVisible();
    }
    expect(screen.getByLabelText('Prato pedido (opcional)')).toHaveValue('Risoto de cogumelos');
    expect(screen.getByLabelText('Prato pedido (opcional)')).toHaveAttribute('maxlength', '80');
    expect(screen.getByLabelText('Comentário')).toHaveValue('Minha contribuição anterior.');
    expect(screen.getByText('152 caracteres restantes')).toBeInTheDocument();
  });

  it('aceita teclado, flexiona o contador e bloqueia comentário vazio no cliente', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ScorecardForm initialValues={null} visitId="visit-1" />);

    const food = screen.getByRole('slider', { name: 'Comida' });
    await user.click(food);
    await user.keyboard('{ArrowRight}');
    expect(food).toHaveValue('1');

    fireEvent.change(screen.getByLabelText('Comentário'), {
      target: { value: 'x'.repeat(179) },
    });
    expect(screen.getByText('1 caractere restante')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Comentário'));
    await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));

    expect(screen.getByRole('alert')).toHaveTextContent('O comentário é obrigatório.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia a edição à API real e reflete participante, estado e agregado retornados', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      participantCount: 6,
      publicationState: 'published',
      aggregate: {
        participantCount: 6,
        averages: {
          food: 8.2,
          service: 7.5,
          ambience: 8.7,
          value: 7,
          access: 6.5,
          waitTime: 6,
        },
        overall: 7.3,
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<ScorecardForm initialValues={existing} visitId="visit-1" />);

    await user.clear(screen.getByLabelText('Prato pedido (opcional)'));
    await user.type(screen.getByLabelText('Prato pedido (opcional)'), '  Lámen shoyu  ');
    await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/visits/visit-1/scorecard', expect.objectContaining({
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
    }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ ...existing, dish: 'Lámen shoyu' });
    const status = await screen.findByRole('status', { name: 'Status da avaliação' });
    expect(status).toHaveTextContent('Avaliação salva.');
    expect(status).toHaveTextContent('6 de 8 membros contribuíram.');
    expect(status).toHaveTextContent('Publicada');
    expect(status).toHaveTextContent('Média coletiva: 7,3 de 10.');
  });

  it('mantém notas e comentário após falha de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const user = userEvent.setup();
    render(<ScorecardForm initialValues={existing} visitId="visit-1" />);

    const food = screen.getByRole('slider', { name: 'Comida' });
    await user.click(food);
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível salvar a avaliação. Tente novamente.',
    );
    expect(food).toHaveValue('9');
    expect(screen.getByLabelText('Prato pedido (opcional)')).toHaveValue(existing.dish);
    expect(screen.getByLabelText('Comentário')).toHaveValue(existing.comment);
  });
});
