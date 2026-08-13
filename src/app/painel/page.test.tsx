import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord, PendingVisit, PublicVisitSummary } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  requireMember: vi.fn(),
  listPendingVisitsForMember: vi.fn(),
  listVisitsInFormationForMember: vi.fn(),
  listPublicVisits: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({ requireMember: dependencies.requireMember }));
vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(async () => undefined),
}));
vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: () => ({
    listPendingVisitsForMember: dependencies.listPendingVisitsForMember,
    listVisitsInFormationForMember: dependencies.listVisitsInFormationForMember,
    listPublicVisits: dependencies.listPublicVisits,
  }),
}));

import DashboardPage from './page';

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

const pending: PendingVisit = {
  id: 'visit-1',
  slug: 'mesa-pendente',
  restaurantName: 'Mesa Pendente',
  visitedAt: '2026-08-10',
  participantCount: 2,
  quorum: 6,
  hasSubmitted: false,
  publicationState: 'private',
};

const published: PublicVisitSummary = {
  id: 'visit-2',
  slug: 'mesa-publicada',
  restaurant: {
    slug: 'mesa',
    name: 'Mesa Publicada',
    cuisine: 'Brasileira',
    neighborhood: 'Centro',
    city: 'São Paulo',
    address: null,
    priceBand: null,
  },
  visitedAt: '2026-08-09',
  publishedAt: '2026-08-12T18:00:00.000Z',
  participantCount: 6,
  averages: null,
  overall: null,
  coverPhotoUrl: null,
};

describe('página privada do painel', () => {
  beforeEach(() => {
    for (const dependency of Object.values(dependencies)) dependency.mockReset();
    dependencies.requireMember.mockResolvedValue(member);
    dependencies.listPendingVisitsForMember.mockResolvedValue([pending]);
    dependencies.listVisitsInFormationForMember.mockResolvedValue([]);
    dependencies.listPublicVisits.mockResolvedValue([published]);
  });

  it('autoriza primeiro e só então inicia as três leituras independentes em paralelo', async () => {
    let authorize: (value: MemberRecord) => void = () => undefined;
    let releasePending: (value: PendingVisit[]) => void = () => undefined;
    let releaseForming: (value: PendingVisit[]) => void = () => undefined;
    let releasePublic: (value: PublicVisitSummary[]) => void = () => undefined;
    dependencies.requireMember.mockReturnValue(new Promise((resolve) => { authorize = resolve; }));
    dependencies.listPendingVisitsForMember.mockReturnValue(new Promise((resolve) => { releasePending = resolve; }));
    dependencies.listVisitsInFormationForMember.mockReturnValue(new Promise((resolve) => { releaseForming = resolve; }));
    dependencies.listPublicVisits.mockReturnValue(new Promise((resolve) => { releasePublic = resolve; }));

    const pagePromise = DashboardPage();
    expect(dependencies.requireMember).toHaveBeenCalledOnce();
    expect(dependencies.listPendingVisitsForMember).not.toHaveBeenCalled();
    authorize(member);
    await vi.waitFor(() => {
      expect(dependencies.listPendingVisitsForMember).toHaveBeenCalledWith(member.id);
      expect(dependencies.listVisitsInFormationForMember).toHaveBeenCalledWith(member.id);
      expect(dependencies.listPublicVisits).toHaveBeenCalledWith({});
    });
    releasePending([pending]);
    releaseForming([]);
    releasePublic([published]);

    render(await pagePromise);
    expect(screen.getByRole('heading', { name: 'Seu painel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    expect(screen.getByText('Mesa Pendente')).toBeInTheDocument();
    expect(screen.getByText('Mesa Publicada')).toBeInTheDocument();
  });

  it('não consulta nem renderiza dados quando a autorização falha', async () => {
    dependencies.requireMember.mockRejectedValue(new Error('Não autorizado'));

    await expect(DashboardPage()).rejects.toThrow('Não autorizado');
    expect(dependencies.listPendingVisitsForMember).not.toHaveBeenCalled();
    expect(dependencies.listVisitsInFormationForMember).not.toHaveBeenCalled();
    expect(dependencies.listPublicVisits).not.toHaveBeenCalled();
  });
});
