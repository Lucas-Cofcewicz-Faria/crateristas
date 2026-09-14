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

import HistoryPage from './page';

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

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.listPublicMembers.mockResolvedValue([publicMember]);
  dependencies.findOptionalMember.mockResolvedValue(null);
});

describe('/historia', () => {
  it('consulta integrantes e sessão em paralelo e renderiza os quatro capítulos', async () => {
    let releaseMembers: (value: PublicMemberSummary[]) => void = () => undefined;
    let releaseViewer: (value: MemberRecord | null) => void = () => undefined;
    dependencies.listPublicMembers.mockReturnValue(new Promise((resolve) => {
      releaseMembers = resolve;
    }));
    dependencies.findOptionalMember.mockReturnValue(new Promise((resolve) => {
      releaseViewer = resolve;
    }));

    const pagePromise = HistoryPage();

    expect(dependencies.listPublicMembers).toHaveBeenCalledOnce();
    expect(dependencies.findOptionalMember).toHaveBeenCalledOnce();
    releaseMembers([publicMember]);
    releaseViewer(null);
    render(await pagePromise);

    expect(screen.getByRole('heading', { name: 'A cratera nos encontrou primeiro.' }))
      .toBeInTheDocument();
    for (const title of ['A descoberta', 'A peregrinação', 'A sociedade', 'Patrimônio natural']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { name: '1 Craterista' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Craterista nº 01: Ana Souza' }))
      .toBeInTheDocument();
  });

  it('mostra o painel apenas ao membro sem vazar seu registro privado', async () => {
    dependencies.findOptionalMember.mockResolvedValue(viewer);

    render(await HistoryPage());

    expect(screen.getByRole('link', { name: 'Suas avaliações pendentes' }))
      .toHaveAttribute('href', '/painel');
    expect(document.body).not.toHaveTextContent(
      /privado@example\.com|auth-user-private-canary|member-private-canary/,
    );
  });
});
