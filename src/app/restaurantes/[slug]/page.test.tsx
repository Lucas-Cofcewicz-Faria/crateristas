import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MemberRecord,
  PublicVisitDetail,
} from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findOptionalMember: vi.fn(),
  getPublicVisitDetail: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND_TEST');
  }),
}));

vi.mock('@/lib/auth/access', () => ({
  findOptionalMember: dependencies.findOptionalMember,
}));

vi.mock('./data', () => ({
  getPublicVisitDetail: dependencies.getPublicVisitDetail,
}));

vi.mock('next/navigation', async (importOriginal) => ({
  ...await importOriginal<typeof import('next/navigation')>(),
  notFound: dependencies.notFound,
}));

import RestaurantPage, { generateMetadata } from './page';

afterEach(cleanup);

const visit: PublicVisitDetail = {
  id: 'visit-1',
  slug: 'casa-da-cratera-2026-08-10',
  restaurant: {
    slug: 'casa-da-cratera',
    name: 'Casa da Cratera',
    cuisine: 'Brasileira',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    address: 'Rua do Fogo, 8',
    priceBand: '$$$',
  },
  visitedAt: '2026-08-10T00:00:00.000Z',
  publishedAt: '2026-08-12T18:00:00.000Z',
  participantCount: 3,
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
  photos: [],
  comments: [
    {
      memberId: 'member-1',
      displayName: 'Ana Souza',
      avatarUrl: null,
      comment: 'Um jantar cuidadoso do começo ao fim.',
      dish: 'Peixe grelhado',
      scores: {
        food: 9,
        service: 8,
        ambience: 8.5,
        value: 7.5,
        access: 8,
        waitTime: 7,
      },
      overall: 8,
    },
  ],
  historical: null,
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

describe('página pública de uma visita', () => {
  beforeEach(() => {
    dependencies.findOptionalMember.mockReset();
    dependencies.getPublicVisitDetail.mockReset();
    dependencies.notFound.mockClear();
    dependencies.findOptionalMember.mockResolvedValue(null);
    dependencies.getPublicVisitDetail.mockResolvedValue(visit);
  });

  it('aguarda o slug e compõe evidências públicas sem round-trip de API', async () => {
    render(await RestaurantPage({
      params: Promise.resolve({ slug: 'casa-da-cratera-2026-08-10' }),
    }));

    expect(dependencies.getPublicVisitDetail)
      .toHaveBeenCalledWith('casa-da-cratera-2026-08-10');
    expect(screen.getByRole('heading', { name: 'Casa da Cratera' })).toBeInTheDocument();
    expect(screen.getByText('Um jantar cuidadoso do começo ao fim.')).toBeInTheDocument();
    expect(screen.getByText('3 crateristas contribuíram')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText(/veredito|nota individual/i)).not.toBeInTheDocument();
  });

  it('habilita o shell de membro somente para uma sessão provisionada', async () => {
    dependencies.findOptionalMember.mockResolvedValue(member);

    render(await RestaurantPage({ params: Promise.resolve({ slug: visit.slug }) }));

    expect(screen.getByRole('link', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('renderiza o contrato legado sem preencher categorias ou scorecards ausentes', async () => {
    dependencies.getPublicVisitDetail.mockResolvedValue({
      ...visit,
      participantCount: 0,
      averages: null,
      overall: null,
      comments: [],
      historical: {
        legacyReviewId: 'legacy-1',
        payload: { scores: { food: 8, service: 6, ambience: 7, value: 9 } },
        scores: {
          food: 8,
          service: 6,
          ambience: 7,
          value: 9,
          access: null,
          waitTime: null,
        },
        overall: 7.5,
      },
    });

    render(await RestaurantPage({ params: Promise.resolve({ slug: visit.slug }) }));

    expect(screen.getByRole('img', { name: 'Nota coletiva: 7,5 de 10' }))
      .toBeInTheDocument();
    expect(screen.getAllByText('Não avaliado')).toHaveLength(2);
    expect(screen.getByText('Nenhum comentário foi publicado para esta visita.'))
      .toBeInTheDocument();
    expect(screen.queryByText(/nota individual|scorecard/i)).not.toBeInTheDocument();
  });

  it('não revela se um slug ausente corresponde a uma visita privada', async () => {
    dependencies.getPublicVisitDetail.mockResolvedValue(null);

    await expect(RestaurantPage({ params: Promise.resolve({ slug: 'visita-privada' }) }))
      .rejects.toThrow('NEXT_NOT_FOUND_TEST');
    expect(dependencies.notFound).toHaveBeenCalledOnce();
  });

  it('gera metadata coletiva em pt-BR sem comentário ou atribuição individual', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: visit.slug }),
    });

    expect(metadata).toEqual({
      title: 'Casa da Cratera — registro coletivo',
      description: 'Visita ao restaurante Casa da Cratera em 10 de agosto de 2026. Nota coletiva 8,2 de 10, com 3 crateristas participantes.',
    });
    expect(JSON.stringify(metadata)).not.toMatch(/Ana Souza|jantar cuidadoso/i);
  });

  it('aplica o mesmo notFound quando a metadata não encontra projeção pública', async () => {
    dependencies.getPublicVisitDetail.mockResolvedValue(null);

    await expect(generateMetadata({ params: Promise.resolve({ slug: 'não-publicado' }) }))
      .rejects.toThrow('NEXT_NOT_FOUND_TEST');
    expect(dependencies.notFound).toHaveBeenCalledOnce();
  });
});
