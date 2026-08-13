import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({ requireMember: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ requireMember: dependencies.requireMember }));
vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(async () => undefined),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import NewVisitError from './error';
import NewVisitLoading from './loading';
import NewVisitPage from './page';

afterEach(cleanup);

const member: MemberRecord = {
  id: 'member-1',
  authUserId: 'auth-user-1',
  email: 'ana@example.com',
  slug: 'ana',
  displayName: 'Ana',
  avatarUrl: null,
  societyTitle: null,
  memberNumber: 1,
  bio: 'Integrante.',
  favoriteCuisine: null,
  role: 'member',
};

describe('página privada de criação de visita', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.requireMember.mockResolvedValue(member);
  });

  it('exige membro antes de renderizar o formulário manual', async () => {
    render(await NewVisitPage());

    expect(dependencies.requireMember).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Registrar nova visita' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preencher com Google Maps' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do restaurante')).toBeInTheDocument();
  });

  it('não renderiza o formulário quando a autorização falha', async () => {
    dependencies.requireMember.mockRejectedValue(new Error('Não autorizado'));
    await expect(NewVisitPage()).rejects.toThrow('Não autorizado');
  });

  it('oferece estados de carregamento e recuperação sem expor o erro', () => {
    const reset = vi.fn();
    const { rerender } = render(<NewVisitLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Preparando o formulário...');

    rerender(<NewVisitError error={new Error('segredo')} reset={reset} />);
    expect(screen.getByRole('heading', { name: 'Não foi possível abrir o formulário.' }))
      .toBeInTheDocument();
    screen.getByRole('button', { name: 'Tentar novamente' }).click();
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.queryByText('segredo')).not.toBeInTheDocument();
  });
});
