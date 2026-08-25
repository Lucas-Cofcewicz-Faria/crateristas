import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PasswordResetAction, PasswordResetState } from './auth-state';
import { PasswordResetRequestForm } from './PasswordResetRequestForm';

afterEach(cleanup);

describe('PasswordResetRequestForm', () => {
  it('solicita somente o e-mail e oferece retorno à entrada', () => {
    const action: PasswordResetAction = vi.fn();

    render(<PasswordResetRequestForm action={action} />);

    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'autocomplete',
      'email',
    );
    expect(screen.getByRole('button', { name: 'Enviar link' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.getByRole('link', { name: 'Voltar para a entrada' }))
      .toHaveAttribute('href', '/entrar');
  });

  it('confirma o pedido com uma mensagem que não revela se o e-mail existe', async () => {
    const action = vi.fn<PasswordResetAction>(async () => ({
      status: 'sent',
      message: 'Se o e-mail estiver cadastrado, enviaremos um link para definir uma nova senha.',
    }));
    render(<PasswordResetRequestForm action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Se o e-mail estiver cadastrado, enviaremos um link para definir uma nova senha.',
    );
  });

  it('desabilita o envio enquanto a solicitação está em andamento', async () => {
    let resolveAction: (state: PasswordResetState) => void = () => undefined;
    const action = vi.fn<PasswordResetAction>(() => new Promise<PasswordResetState>((resolve) => {
      resolveAction = resolve;
    }));
    render(<PasswordResetRequestForm action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByRole('button', { name: 'Enviando...' })).toBeDisabled();

    resolveAction({ status: 'sent', message: 'Pedido recebido.' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enviar link' })).toBeEnabled();
    });
  });
});
