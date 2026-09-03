import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MemberRecord,
  PublicMemberSummary,
  PublicVisitSummary,
} from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findOptionalMember: vi.fn(),
  listPublicMembers: vi.fn(),
  listPublicVisits: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({
  findOptionalMember: dependencies.findOptionalMember,
}));
vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: () => ({
    listPublicMembers: dependencies.listPublicMembers,
    listPublicVisits: dependencies.listPublicVisits,
  }),
}));

import HomePage from './page';

afterEach(cleanup);

function record(id: string, restaurantSlug: string, name: string): PublicVisitSummary {
  return {
    id,
    slug: `registro-${id}`,
    restaurant: {
      slug: restaurantSlug,
      name,
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: null,
      priceBand: null,
    },
    visitedAt: '2026-08-30',
    publishedAt: '2026-08-31T12:00:00.000Z',
    coverPhotoUrl: null,
    participantCount: 6,
    averages: null,
    overall: 8,
  };
}

const recordA = record('1', 'a', 'A');
const duplicateA = record('2', 'a', 'A');
const recordB = record('3', 'b', 'B');
const publicMember: PublicMemberSummary = {
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: null,
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Coleciona relatos de mesas memoráveis.',
  favoriteCuisine: 'Brasileira',
  contributions: { publishedVisits: 7, scorecards: 7 },
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
  dependencies.listPublicVisits.mockResolvedValue([recordA, duplicateA, recordB]);
  dependencies.listPublicMembers.mockResolvedValue([publicMember]);
  dependencies.findOptionalMember.mockResolvedValue(null);
});

describe('/home', () => {
  it('marca as camadas editoriais para a coreografia pública', async () => {
    const { container } = render(await HomePage());
    expect(screen.getByRole('heading', { name: 'Bem-vindo à cratera' }))
      .toHaveAttribute('data-motion', 'inscription');
    expect(screen.getByRole('heading', { name: 'Restaurantes mais recentes' }))
      .toHaveAttribute('data-motion', 'inscription');
    expect(container.querySelectorAll('[data-motion="constellation"]')).toHaveLength(1);
  });

  it('inicia as três consultas em paralelo e renderiza a experiência pública', async () => {
    let releaseRecords: (value: PublicVisitSummary[]) => void = () => undefined;
    let releaseMembers: (value: PublicMemberSummary[]) => void = () => undefined;
    let releaseViewer: (value: MemberRecord | null) => void = () => undefined;
    dependencies.listPublicVisits.mockReturnValue(new Promise((resolve) => { releaseRecords = resolve; }));
    dependencies.listPublicMembers.mockReturnValue(new Promise((resolve) => { releaseMembers = resolve; }));
    dependencies.findOptionalMember.mockReturnValue(new Promise((resolve) => { releaseViewer = resolve; }));

    const pagePromise = HomePage();

    expect(dependencies.listPublicVisits).toHaveBeenCalledWith({});
    expect(dependencies.listPublicMembers).toHaveBeenCalledOnce();
    expect(dependencies.findOptionalMember).toHaveBeenCalledOnce();

    releaseRecords([recordA, duplicateA, recordB]);
    releaseMembers([publicMember]);
    releaseViewer(null);
    render(await pagePromise);

    expect(screen.getByRole('heading', { name: 'Bem-vindo à cratera' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar restaurantes' })).toHaveAttribute('href', '/registros');
    expect(screen.getByRole('heading', { name: 'Restaurantes mais recentes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A cratera nos encontrou primeiro.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Os oito Crateristas' })).toBeInTheDocument();
  });

  it('seleciona restaurantes únicos e adapta o encerramento ao membro sem vazar dados privados', async () => {
    dependencies.findOptionalMember.mockResolvedValue(viewer);

    render(await HomePage());

    expect(screen.getByRole('button', { name: 'Mostrar restaurante 1: A' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restaurante 2: A/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir seu painel' })).toHaveAttribute('href', '/painel');
    expect(document.body).not.toHaveTextContent(/privado@example\.com|auth-user-private-canary/);
  });
});
