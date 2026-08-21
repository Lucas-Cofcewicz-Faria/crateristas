import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/PasswordResetRequestForm', () => ({
  PasswordResetRequestForm: () => (
    <form aria-label="Formulário de recuperação de senha" />
  ),
}));
vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(),
  requestPasswordResetAction: vi.fn(),
}));

import PasswordResetRequestPage from './page';

afterEach(cleanup);

describe('página de recuperação de senha', () => {
  it('explica o envio sem oferecer cadastro público', () => {
    render(<PasswordResetRequestPage />);

    expect(screen.getByRole('heading', { name: 'Recupere seu acesso' }))
      .toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Formulário de recuperação de senha' }))
      .toBeInTheDocument();
    expect(screen.queryByText(/cadastro|criar conta|magic link/i))
      .not.toBeInTheDocument();
  });
});
