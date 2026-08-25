import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PasswordResetAction, PasswordResetState } from './auth-state';
import { PasswordResetForm } from './PasswordResetForm';

afterEach(cleanup);

describe('PasswordResetForm', () => {
  it('pede a senha duas vezes sem receber o token no cliente', () => {
    const action: PasswordResetAction = vi.fn();

    const { container } = render(<PasswordResetForm action={action} />);

    expect(container.querySelector('input[name="token"]')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByLabelText('Nova senha')).toHaveAttribute('maxlength', '128');
    expect(screen.getByLabelText('Confirme a nova senha')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
  });

  it('mostra o erro da ação e não inclui as senhas no texto da página', async () => {
    const password = 'senha-privada';
    const action = vi.fn<PasswordResetAction>(async () => ({
      status: 'error',
      message: 'As senhas não coincidem.',
    }));
    render(<PasswordResetForm action={action} />);

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: password },
    });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: 'outra-senha' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Definir nova senha' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'As senhas não coincidem.',
    );
    expect(document.body).not.toHaveTextContent(password);
  });

  it('desabilita a confirmação enquanto a ação está em andamento', async () => {
    let resolveAction: (state: PasswordResetState) => void = () => undefined;
    const action = vi.fn<PasswordResetAction>(() => new Promise<PasswordResetState>((resolve) => {
      resolveAction = resolve;
    }));
    render(<PasswordResetForm action={action} />);

    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: 'senha-segura' },
    });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: 'senha-segura' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Definir nova senha' }));

    expect(await screen.findByRole('button', { name: 'Salvando...' })).toBeDisabled();

    resolveAction({ status: 'error', message: 'Tente novamente.' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Definir nova senha' })).toBeEnabled();
    });
  });
});
