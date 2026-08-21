import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: dependencies.cookies }));

vi.mock('@/features/auth/PasswordResetForm', () => ({
  PasswordResetForm: () => <form aria-label="Formulário de nova senha" />,
}));
vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(),
  resetPasswordAction: vi.fn(),
}));

import PasswordResetPage from './page';

afterEach(() => {
  cleanup();
  dependencies.cookieGet.mockReset();
  dependencies.cookies.mockReset();
});

describe('página de definição de nova senha', () => {
  it('renderiza o formulário quando existe um token HttpOnly', async () => {
    dependencies.cookieGet.mockReturnValue({ value: 'token-valido' });
    dependencies.cookies.mockResolvedValue({ get: dependencies.cookieGet });
    const page = await PasswordResetPage({
      searchParams: Promise.resolve({}),
    });
    render(page);

    expect(screen.getByRole('heading', { name: 'Escolha uma nova senha' }))
      .toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Formulário de nova senha' }))
      .toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('token-valido');
  });

  it.each([
    ['token ausente', {}],
    ['erro do callback', { erro: 'link' }],
  ])('orienta a pedir outro link quando há %s', async (_case, searchParams) => {
    dependencies.cookieGet.mockReturnValue(undefined);
    dependencies.cookies.mockResolvedValue({ get: dependencies.cookieGet });
    const page = await PasswordResetPage({
      searchParams: Promise.resolve(searchParams),
    });
    render(page);

    expect(screen.getByRole('heading', { name: 'Link indisponível' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Formulário de nova senha' }))
      .not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir um novo link' }))
      .toHaveAttribute('href', '/recuperar-senha');
  });
});
