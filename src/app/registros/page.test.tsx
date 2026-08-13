import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord, PublicVisitSummary } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findOptionalMember: vi.fn(),
  listPublicVisits: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({
  findOptionalMember: dependencies.findOptionalMember,
}));

vi.mock('@/lib/reviews/server', () => ({
  getReviewRepository: () => ({
    listPublicVisits: dependencies.listPublicVisits,
  }),
}));

import RecordsPage from './page';

afterEach(cleanup);

const record: PublicVisitSummary = {
  id: 'visit-1',
  slug: 'casa-da-cratera-2026-08-10',
  restaurant: {
    slug: 'casa-da-cratera',
    name: 'Casa da Cratera',
    cuisine: 'Brasileira',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    address: null,
    priceBand: null,
  },
  visitedAt: '2026-08-10T00:00:00.000Z',
  publishedAt: '2026-08-12T18:00:00.000Z',
  participantCount: 6,
  averages: {
    food: 9,
    service: 8,
    ambience: 8.5,
    value: 7.5,
    access: 8,
    waitTime: 7,
  },
  overall: 8.2,
  coverPhotoUrl: null,
};

const member: MemberRecord = {
  id: 'member-1',
  authUserId: 'auth-user-1',
  email: 'ana@example.com',
  slug: 'ana',
  displayName: 'Ana',
  avatarUrl: null,
  societyTitle: null,
  memberNumber: 1,
  bio: 'Integrante da sociedade.',
  favoriteCuisine: null,
  role: 'member',
};

describe('página pública de registros', () => {
  beforeEach(() => {
    dependencies.findOptionalMember.mockReset();
    dependencies.listPublicVisits.mockReset();
    dependencies.findOptionalMember.mockResolvedValue(null);
    dependencies.listPublicVisits.mockResolvedValue([record]);
  });

  it('aguarda e sanitiza os filtros antes de consultar a projeção pública', async () => {
    const page = await RecordsPage({
      searchParams: Promise.resolve({
        busca: ['  Casa da Cratera  ', 'ignorada'],
        culinaria: '  Brasileira ',
        bairro: ' Pinheiros  ',
      }),
    });
    render(page);

    expect(dependencies.listPublicVisits).toHaveBeenCalledWith({
      busca: 'Casa da Cratera',
      culinaria: 'Brasileira',
      bairro: 'Pinheiros',
    });
    expect(screen.getByRole('heading', { name: 'Casa da Cratera' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('habilita o cabeçalho de membro somente para uma sessão provisionada', async () => {
    dependencies.findOptionalMember.mockResolvedValue(member);

    render(await RecordsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('link', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('mantém o estado vazio dentro do livro público', async () => {
    dependencies.listPublicVisits.mockResolvedValue([]);

    render(await RecordsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
  });
});
