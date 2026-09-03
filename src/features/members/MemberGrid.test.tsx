import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PublicMemberSummary } from '@/domain/reviews/repository';
import { MemberGrid } from './MemberGrid';
import { getTrustedMemberAvatarUrl } from './member-avatar';

afterEach(cleanup);

const member: PublicMemberSummary = {
  slug: 'ana-souza',
  displayName: 'Ana Souza',
  avatarUrl: 'https://crateristas.public.blob.vercel-storage.com/members/ana.jpg',
  societyTitle: 'Guardiã das Mesas Longas',
  memberNumber: 1,
  bio: 'Coleciona relatos de mesas memoráveis.',
  favoriteCuisine: 'Brasileira',
  contributions: {
    publishedVisits: 7,
    scorecards: 7,
  },
};

describe('MemberGrid', () => {
  it('mapeia apenas a projeção pública e mantém a ordem de entrada', () => {
    render(<MemberGrid members={[member, { ...member, slug: 'bia', displayName: 'Bia', memberNumber: 2 }]} />);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName('Craterista nº 01: Ana Souza');
    expect(cards[1]).toHaveAccessibleName('Craterista nº 02: Bia');
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-motion', 'constellation');
    expect(items.map((item) => item.getAttribute('data-motion-index')))
      .toEqual(items.map((_, index) => String(index)));
  });

  it('mostra um estado vazio público sem fabricar integrantes', () => {
    render(<MemberGrid members={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum craterista publicado');
  });

  it('limita o diretório às oito entradas da sociedade', () => {
    const members = Array.from({ length: 9 }, (_, index) => ({
      ...member,
      slug: `membro-${index + 1}`,
      displayName: `Membro ${index + 1}`,
      memberNumber: index + 1,
    }));

    render(<MemberGrid members={members} />);

    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(screen.queryByRole('heading', { name: 'Membro 9' })).not.toBeInTheDocument();
  });

  it.each([
    ['http://crateristas.public.blob.vercel-storage.com/members/ana.jpg'],
    ['https://example.com/members/ana.jpg'],
    ['https://crateristas.public.blob.vercel-storage.com/visits/ana.jpg'],
    ['https://crateristas.public.blob.vercel-storage.com/members/ana.jpg?download=1'],
    ['não-é-uma-url'],
  ])('recusa avatar fora da origem e do caminho dedicados: %s', (candidate) => {
    expect(getTrustedMemberAvatarUrl(candidate)).toBeNull();
  });

  it('aceita somente HTTPS do Blob público no caminho de membros', () => {
    expect(getTrustedMemberAvatarUrl(
      'https://crateristas.public.blob.vercel-storage.com/members/ana.jpg',
    )).toBe('https://crateristas.public.blob.vercel-storage.com/members/ana.jpg');
  });
});
