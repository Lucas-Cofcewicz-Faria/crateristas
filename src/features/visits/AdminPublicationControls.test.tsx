import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PublicationState } from '@/domain/reviews/types';
import { AdminPublicationControls } from './AdminPublicationControls';

interface ControlledControlsProps {
  initialState: PublicationState;
  isAdmin?: boolean;
  participantCount: number;
}

function ControlledControls({
  initialState,
  isAdmin = true,
  participantCount,
}: ControlledControlsProps) {
  const [publicationState, setPublicationState] = useState(initialState);
  return (
    <AdminPublicationControls
      isAdmin={isAdmin}
      onChanged={(result) => setPublicationState(result.publicationState)}
      participantCount={participantCount}
      publicationState={publicationState}
      visitId="visit-1"
    />
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  vi.spyOn(HTMLDialogElement.prototype, 'close');
});

describe('controles administrativos de publicação', () => {
  it('não produz markup administrativo para membro comum ou para visita privada sem ficha', () => {
    const { container, rerender } = render(
      <ControlledControls
        initialState="private"
        isAdmin={false}
        participantCount={2}
      />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <ControlledControls
        initialState="private"
        participantCount={0}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('abre confirmação antecipada com contagem/parcialidade e cancelar não chama a API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(
      <ControlledControls
        initialState="private"
        participantCount={2}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Publicar antecipadamente' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirmar publicação antecipada' });
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
    expect(dialog).toHaveProperty('open', true);
    expect(dialog).toHaveAttribute('aria-describedby', 'publication-dialog-description');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(dialog).toHaveTextContent('2 de 8 membros contribuíram');
    expect(dialog).toHaveTextContent('A média ainda é parcial.');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('flexiona a contagem de uma única contribuição', async () => {
    const user = userEvent.setup();
    render(
      <ControlledControls
        initialState="private"
        participantCount={1}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Publicar antecipadamente' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('1 de 8 membros contribuiu');
  });

  it.each([
    ['private', 'Publicar antecipadamente', 'Confirmar publicação', 'publish_early', 'published'],
    ['published', 'Ocultar', 'Confirmar ocultação', 'hide', 'hidden'],
    ['hidden', 'Republicar', 'Confirmar republicação', 'republish', 'published'],
  ] as Array<[PublicationState, string, string, string, PublicationState]>) (
    'confirma %s uma vez e reflete somente o estado retornado pelo servidor',
    async (initialState, actionLabel, confirmLabel, command, returnedState) => {
      let resolveRequest: (response: Response) => void = () => undefined;
      const fetchMock = vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }));
      vi.stubGlobal('fetch', fetchMock);
      const user = userEvent.setup();
      render(
        <ControlledControls
          initialState={initialState}
          participantCount={2}
        />,
      );

      await user.click(screen.getByRole('button', { name: actionLabel }));
      const confirm = screen.getByRole('button', { name: confirmLabel });
      await user.click(confirm);
      expect(confirm).toBeDisabled();
      await user.click(confirm);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledWith('/api/visits/visit-1/publication', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(command),
      });
      resolveRequest(new Response(JSON.stringify({
        publicationState: returnedState,
        publicationReason: returnedState === 'published' ? 'admin_override' : null,
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      const nextAction = returnedState === 'published' ? 'Ocultar' : 'Republicar';
      expect(screen.getByRole('button', { name: nextAction })).toBeInTheDocument();
    },
  );

  it('mantém o diálogo e mostra erro genérico quando o PATCH falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'regra interna',
    }), { status: 409 })));
    const user = userEvent.setup();
    render(
      <ControlledControls
        initialState="published"
        participantCount={6}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Ocultar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar ocultação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível alterar a publicação. Tente novamente.',
    );
    expect(screen.queryByText('regra interna')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Confirmar ocultação' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
  });

  it('fecha no cancel nativo/Escape e restaura foco no acionador', async () => {
    const user = userEvent.setup();
    render(<ControlledControls initialState="published" participantCount={6} />);
    const trigger = screen.getByRole('button', { name: 'Ocultar' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Confirmar ocultação' });
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }));

    await vi.waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });

  it('ignora cancel nativo/Escape enquanto a confirmação está pendente', async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    })));
    const user = userEvent.setup();
    render(<ControlledControls initialState="published" participantCount={6} />);

    await user.click(screen.getByRole('button', { name: 'Ocultar' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirmar ocultação' });
    await user.click(screen.getByRole('button', { name: 'Confirmar ocultação' }));
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }));

    expect(dialog).toHaveAttribute('open');
    resolveRequest(new Response(JSON.stringify({
      publicationState: 'hidden',
      publicationReason: null,
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    await vi.waitFor(() => expect(dialog).not.toHaveAttribute('open'));
  });
});
