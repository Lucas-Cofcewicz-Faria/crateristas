import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  logoutAction: vi.fn(async () => undefined),
}));

vi.mock('@/features/auth/actions', () => ({
  logoutAction: dependencies.logoutAction,
}));
import { AppHeader } from './AppHeader';
import { PublicShell } from './PublicShell';

afterEach(() => {
  cleanup();
  dependencies.logoutAction.mockClear();
});

describe('AppHeader', () => {
  it('oferece a navegação pública e a entrada para visitantes', () => {
    render(<AppHeader viewer="visitor" />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' }))
      .toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Registros' }))
      .toHaveAttribute('href', '/registros');
    expect(screen.getByRole('link', { name: 'Membros' }))
      .toHaveAttribute('href', '/membros');
    expect(screen.getByRole('link', { name: 'Entrar' }))
      .toHaveAttribute('href', '/entrar');

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('tabindex', '-1');
    }
  });

  it('troca a entrada pelo painel e invoca o contrato de saída recebido', async () => {
    const signOutAction = vi.fn(async () => undefined);
    render(<AppHeader viewer="member" signOutAction={signOutAction} />);

    expect(screen.getByRole('link', { name: 'Painel' }))
      .toHaveAttribute('href', '/painel');
    const button = screen.getByRole('button', { name: 'Sair' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();

    fireEvent.submit(button.closest('form')!);
    await waitFor(() => expect(signOutAction).toHaveBeenCalledOnce());
  });

  it('faz todo shell de membro usar a ação real de logout por padrão', async () => {
    render(
      <PublicShell viewer="member">
        <h1>Painel privado</h1>
      </PublicShell>,
    );

    const button = screen.getByRole('button', { name: 'Sair' });
    fireEvent.submit(button.closest('form')!);

    await waitFor(() => expect(dependencies.logoutAction).toHaveBeenCalledOnce());
  });

  it('compõe os marcos compartilhados sem acoplar a sessão ao shell', () => {
    render(
      <PublicShell viewer="visitor">
        <h1>Livro de registros</h1>
      </PublicShell>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Livro de registros' }),
    );
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });
});
