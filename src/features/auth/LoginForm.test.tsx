import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LoginAction, LoginState } from './auth-state';
import { LoginForm } from './LoginForm';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

describe('LoginForm', () => {
  it('oferece somente a entrada fechada por e-mail e senha', () => {
    const action: LoginAction = vi.fn();

    render(<LoginForm action={action} />);

    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute(
      'autocomplete',
      'email',
    );
    expect(screen.getByLabelText('Senha')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/cadastro|criar conta|magic link|google/i))
      .not.toBeInTheDocument();
  });

  it('mostra o estado pendente enquanto a ação está em andamento', async () => {
    let resolveAction: (state: { error: null }) => void = () => undefined;
    const action: LoginAction = vi.fn(() => new Promise<LoginState>((resolve) => {
      resolveAction = resolve;
    }));
    render(<LoginForm action={action} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'segredo-que-nao-vaza' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('button', { name: 'Entrando...' }))
      .toBeDisabled();

    resolveAction({ error: null });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled();
    });
  });

  it('exibe erro genérico sem colocar a senha em logs, URL ou estado visível', async () => {
    const user = userEvent.setup();
    const password = 'Senha-privada-123!';
    const action: LoginAction = vi.fn(async () => ({
      error: 'E-mail ou senha inválidos.' as const,
    }));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    window.history.replaceState({}, '', '/entrar');
    render(<LoginForm action={action} />);

    await user.type(screen.getByRole('textbox', { name: 'E-mail' }), 'ana@example.com');
    await user.type(screen.getByLabelText('Senha'), password);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha inválidos.',
    );
    expect(window.location.href).not.toContain(password);
    expect(document.body).not.toHaveTextContent(password);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
  });
});
