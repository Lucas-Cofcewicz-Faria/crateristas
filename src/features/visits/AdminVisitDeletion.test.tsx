import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminVisitDeletion } from './AdminVisitDeletion';

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  navigation.push.mockReset();
  navigation.refresh.mockReset();
  vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  vi.spyOn(HTMLDialogElement.prototype, 'close');
});

function renderDeletion(isAdmin = true, participantCount = 3) {
  return render(
    <AdminVisitDeletion
      isAdmin={isAdmin}
      participantCount={participantCount}
      restaurantName="Mesa Coletiva"
      visitId="11111111-1111-4111-8111-111111111111"
    />,
  );
}

describe('exclusão administrativa de review', () => {
  it('não expõe a área destrutiva para membro comum', () => {
    const { container } = renderDeletion(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('avisa a quantidade antes da ação e exige a frase exata no diálogo', async () => {
    const user = userEvent.setup();
    renderDeletion(true, 3);

    const section = screen.getByRole('region', { name: 'Excluir review' });
    expect(section).toHaveTextContent('3 avaliações serão apagadas');
    await user.click(screen.getByRole('button', { name: 'Excluir review permanentemente' }));

    const dialog = screen.getByRole('dialog', { name: 'Excluir review de Mesa Coletiva?' });
    expect(dialog).toHaveTextContent('3 avaliações de membros serão apagadas permanentemente');
    expect(dialog).toHaveTextContent('Deletar review');
    const input = screen.getByRole('textbox', { name: 'Confirmação de exclusão' });
    const confirm = screen.getByRole('button', { name: 'Deletar definitivamente' });
    expect(confirm).toBeDisabled();

    await user.type(input, 'deletar review');
    expect(confirm).toBeDisabled();
    await user.clear(input);
    await user.type(input, 'Deletar review');
    expect(confirm).toBeEnabled();
  });

  it('apaga uma única vez e retorna ao painel depois do 204', async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderDeletion();

    await user.click(screen.getByRole('button', { name: 'Excluir review permanentemente' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Confirmação de exclusão' }),
      'Deletar review',
    );
    const confirm = screen.getByRole('button', { name: 'Deletar definitivamente' });
    await user.click(confirm);
    await user.click(confirm);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/visits/11111111-1111-4111-8111-111111111111',
      expect.objectContaining({
        body: JSON.stringify({
          confirmation: 'Deletar review',
          expectedParticipantCount: 3,
        }),
      }),
    );
    expect(confirm).toBeDisabled();
    resolveRequest(new Response(null, { status: 204 }));

    await vi.waitFor(() => {
      expect(navigation.push).toHaveBeenCalledWith('/painel');
      expect(navigation.refresh).toHaveBeenCalledOnce();
    });
  });

  it('mantém o diálogo aberto e orienta retry quando a exclusão falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'detalhe interno',
    }), { status: 500 })));
    const user = userEvent.setup();
    renderDeletion(true, 1);

    await user.click(screen.getByRole('button', { name: 'Excluir review permanentemente' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '1 avaliação de membro será apagada permanentemente',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Confirmação de exclusão' }),
      'Deletar review',
    );
    await user.click(screen.getByRole('button', { name: 'Deletar definitivamente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir a review. Tente novamente.',
    );
    expect(screen.queryByText('detalhe interno')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Excluir review de Mesa Coletiva?' }))
      .toBeInTheDocument();
  });

  it('manda recarregar quando outra avaliação mudou a quantidade confirmada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 409 })));
    const user = userEvent.setup();
    renderDeletion(true, 3);

    await user.click(screen.getByRole('button', { name: 'Excluir review permanentemente' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Confirmação de exclusão' }),
      'Deletar review',
    );
    await user.click(screen.getByRole('button', { name: 'Deletar definitivamente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A quantidade de avaliações mudou. Recarregue a página antes de excluir.',
    );
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
