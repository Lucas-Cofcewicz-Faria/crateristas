import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppHeader } from './AppHeader';
import { PublicShell } from './PublicShell';

afterEach(cleanup);

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

  it('troca a entrada pelo painel e por uma ação de saída para membros', () => {
    render(<AppHeader viewer="member" />);

    expect(screen.getByRole('link', { name: 'Painel' }))
      .toHaveAttribute('href', '/painel');
    expect(screen.getByRole('button', { name: 'Sair' }))
      .toHaveAttribute('type', 'submit');
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
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
