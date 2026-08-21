import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/LoginForm', () => ({
  LoginForm: () => <form aria-label="Formulário de entrada" />,
}));
vi.mock('@/features/auth/actions', () => ({
  loginAction: vi.fn(),
  logoutAction: vi.fn(async () => undefined),
}));

import LoginPage from './page';

afterEach(cleanup);

describe('página de entrada', () => {
  it('usa o shell público de visitante e não oferece cadastro', async () => {
    const page = await LoginPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByRole('heading', { name: 'Entrada de membros' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Formulário de entrada' })).toBeInTheDocument();
    expect(screen.queryByText(/cadastro|criar conta|magic link/i)).not.toBeInTheDocument();
  });

  it('confirma que a nova senha foi definida', async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({ senha: 'definida' }),
    });
    render(page);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Senha definida. Você já pode entrar.',
    );
  });
});
