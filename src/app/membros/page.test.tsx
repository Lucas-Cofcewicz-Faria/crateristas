import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MemberRecord,
  PublicMemberSummary,
} from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findOptionalMember: vi.fn(),
  listPublicMembers: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({
  findOptionalMember: dependencies.findOptionalMember,
}));

vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: () => ({
    listPublicMembers: dependencies.listPublicMembers,
  }),
}));

import MembersPage from './page';

afterEach(cleanup);

const publicMember: PublicMemberSummary = {
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Coleciona relatos de mesas memoráveis.',
  favoriteCuisine: 'Brasileira',
  contributions: {
    publishedVisits: 7,
    scorecards: 7,
  },
};

const viewer: MemberRecord = {
  id: 'member-private-canary',
  authUserId: 'auth-user-private-canary',
  email: 'privado@example.com',
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Não deve ser lida deste objeto.',
  favoriteCuisine: 'Não deve ser lida deste objeto.',
  role: 'admin',
};

describe('página pública de membros', () => {
  beforeEach(() => {
    dependencies.findOptionalMember.mockReset();
    dependencies.listPublicMembers.mockReset();
    dependencies.findOptionalMember.mockResolvedValue(null);
    dependencies.listPublicMembers.mockResolvedValue([publicMember]);
  });

  it('inicia diretório e sessão em paralelo e renderiza o shell de visitante', async () => {
    let releaseMembers: (value: PublicMemberSummary[]) => void = () => undefined;
    let releaseViewer: (value: MemberRecord | null) => void = () => undefined;
    dependencies.listPublicMembers.mockReturnValue(new Promise((resolve) => {
      releaseMembers = resolve;
    }));
    dependencies.findOptionalMember.mockReturnValue(new Promise((resolve) => {
      releaseViewer = resolve;
    }));

    const pagePromise = MembersPage();

    expect(dependencies.listPublicMembers).toHaveBeenCalledOnce();
    expect(dependencies.findOptionalMember).toHaveBeenCalledOnce();
    releaseMembers([publicMember]);
    releaseViewer(null);
    render(await pagePromise);

    expect(screen.getByRole('heading', { name: 'Os oito Crateristas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Suas avaliações pendentes' }))
      .not.toBeInTheDocument();
  });

  it('oferece avaliações pendentes somente a um membro mapeado sem vazar seu registro', async () => {
    dependencies.findOptionalMember.mockResolvedValue(viewer);

    render(await MembersPage());

    expect(screen.getByRole('link', { name: 'Suas avaliações pendentes' }))
      .toHaveAttribute('href', '/painel');
    expect(screen.getByRole('link', { name: 'Painel' })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(
      /privado@example\.com|auth-user-private-canary|member-private-canary|administrador/i,
    );
  });
});
