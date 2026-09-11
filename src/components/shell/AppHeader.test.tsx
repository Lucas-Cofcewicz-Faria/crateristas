import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  logoutAction: vi.fn(async () => undefined),
  pathname: '/home',
}));

vi.mock('next/navigation', () => ({ usePathname: () => dependencies.pathname }));

vi.mock('@/features/auth/actions', () => ({
  logoutAction: dependencies.logoutAction,
}));
import { AppHeader } from './AppHeader';
import { PublicShell } from './PublicShell';

afterEach(() => {
  cleanup();
  dependencies.logoutAction.mockClear();
  dependencies.pathname = '/home';
});

describe('AppHeader', () => {
  it('reserva o acesso opcional 3D ao final do rodapé da home', () => {
    const view = render(<PublicShell viewer="visitor"><h1>Home</h1></PublicShell>);
    const link = screen.getByRole('link', { name: 'Visitar a cratera em 3D', hidden: true });
    expect(link).toHaveAttribute('href', '/?explorar=1');
    expect(screen.getByRole('contentinfo')).toContainElement(link);
    expect(screen.getByRole('banner')).not.toContainElement(link);
    dependencies.pathname = '/registros';
    view.rerender(<PublicShell viewer="visitor"><h1>Registros</h1></PublicShell>);
    expect(screen.queryByRole('link', { name: 'Visitar a cratera em 3D', hidden: true })).not.toBeInTheDocument();
  });

  it('abre o menu compacto e o fecha com Escape ou ao escolher uma página', () => {
    render(<AppHeader viewer="visitor" />);
    const toggle = screen.getByLabelText('Abrir menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('link', { name: 'Registros' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('retorna suavemente ao início sem recarregar a home atual', () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<AppHeader viewer="visitor" />);
    fireEvent.click(screen.getByRole('link', { name: 'Crateristas — início' }));
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    scroll.mockRestore();
  });

  it('identifica a seção atual também nas páginas de um restaurante', () => {
    dependencies.pathname = '/restaurantes/casa-da-cratera';
    render(<AppHeader viewer="visitor" />);
    expect(screen.getByRole('link', { name: 'Registros' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'História' })).not.toHaveAttribute('aria-current');
  });

  it('oferece a navegação pública e a entrada para visitantes', () => {
    render(<AppHeader viewer="visitor" />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação principal' }))
      .toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Registros' }))
      .toHaveAttribute('href', '/registros');
    expect(screen.getByRole('link', { name: 'Crateristas — início' }))
      .toHaveAttribute('href', '/home');
    expect(screen.getByRole('link', { name: 'História' }))
      .toHaveAttribute('href', '/historia');
    expect(screen.queryByRole('link', { name: 'Membros' })).not.toBeInTheDocument();
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
    const footerNavigation = screen.getByRole('navigation', { name: 'Navegação do rodapé' });
    expect(within(footerNavigation).getByRole('link', { name: 'História' }))
      .toHaveAttribute('href', '/historia');
  });
});
