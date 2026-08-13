import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  requireMember: vi.fn(),
  getReviewRepository: vi.fn(),
  getVisitReviewWorkspace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({ requireMember: dependencies.requireMember }));
vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(async () => undefined),
}));
vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: dependencies.getReviewRepository,
}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('not_found'); }),
  useRouter: () => ({ refresh: dependencies.refresh }),
}));

import EvaluateVisitPage from './page';
import EvaluateVisitError from './error';
import EvaluateVisitLoading from './loading';

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

const workspace = {
  id: 'visit-1',
  restaurantName: 'Mesa Segura',
  cuisine: 'Brasileira',
  neighborhood: 'Centro',
  city: 'São Paulo',
  visitedAt: '2026-08-10',
  participantCount: 2,
  quorum: 6,
  publicationState: 'private' as const,
  createdBy: member.id,
  ownScorecard: {
    food: 8,
    service: 7,
    ambience: 9,
    value: 6,
    access: 5,
    waitTime: 4,
    comment: 'Minha ficha.',
  },
  photos: [],
};

describe('página privada de avaliação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.requireMember.mockResolvedValue(member);
    dependencies.getVisitReviewWorkspace.mockResolvedValue(workspace);
    dependencies.getReviewRepository.mockReturnValue({
      getVisitReviewWorkspace: dependencies.getVisitReviewWorkspace,
    });
  });

  it('autoriza o membro antes de instanciar o repository e ler a projeção privada', async () => {
    let authorize: (value: MemberRecord) => void = () => undefined;
    dependencies.requireMember.mockReturnValue(new Promise((resolve) => { authorize = resolve; }));

    const pagePromise = EvaluateVisitPage({ params: Promise.resolve({ id: 'visit-1' }) });

    expect(dependencies.requireMember).toHaveBeenCalledOnce();
    expect(dependencies.getReviewRepository).not.toHaveBeenCalled();
    expect(dependencies.getVisitReviewWorkspace).not.toHaveBeenCalled();

    authorize(member);
    await vi.waitFor(() => {
      expect(dependencies.getReviewRepository).toHaveBeenCalledOnce();
      expect(dependencies.getVisitReviewWorkspace).toHaveBeenCalledWith('visit-1', member.id);
    });

    render(await pagePromise);
    expect(screen.getByRole('heading', { name: 'Avaliar Mesa Segura' })).toBeInTheDocument();
    expect(screen.getByText('Em formação')).toBeInTheDocument();
    expect(screen.getByText('2 de 6 membros contribuíram')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ficha de avaliação' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Comida' })).toHaveValue('8');
    expect(screen.getByRole('heading', { name: 'Fotos da visita' })).toBeInTheDocument();
    expect(screen.getByLabelText('Selecionar fotos')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publicar antecipadamente' }))
      .not.toBeInTheDocument();
  });

  it('deriva o papel administrativo no servidor e só então expõe a ação válida', async () => {
    dependencies.requireMember.mockResolvedValue({ ...member, role: 'admin' });

    render(await EvaluateVisitPage({ params: Promise.resolve({ id: 'visit-1' }) }));

    expect(screen.getByRole('button', { name: 'Publicar antecipadamente' })).toBeInTheDocument();
  });

  it('não consulta nem renderiza dados quando a autorização falha', async () => {
    dependencies.requireMember.mockRejectedValue(new Error('Não autorizado'));

    await expect(EvaluateVisitPage({ params: Promise.resolve({ id: 'visit-1' }) }))
      .rejects.toThrow('Não autorizado');
    expect(dependencies.getReviewRepository).not.toHaveBeenCalled();
    expect(dependencies.getVisitReviewWorkspace).not.toHaveBeenCalled();
  });

  it('oferece estados de carregamento e recuperação em pt-BR', () => {
    const reset = vi.fn();
    const { rerender } = render(<EvaluateVisitLoading />);
    expect(screen.getByRole('status')).toHaveTextContent('Preparando a avaliação...');

    rerender(<EvaluateVisitError error={new Error('interno')} reset={reset} />);
    expect(screen.getByRole('heading', { name: 'Não foi possível abrir esta avaliação.' }))
      .toBeInTheDocument();
    screen.getByRole('button', { name: 'Tentar novamente' }).click();
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.queryByText('interno')).not.toBeInTheDocument();
  });
});
