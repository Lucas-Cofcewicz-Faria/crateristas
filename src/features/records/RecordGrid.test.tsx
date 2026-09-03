import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PublicVisitSummary } from '@/domain/reviews/repository';
import { RecordGrid } from './RecordGrid';

vi.mock('./RecordCard', () => ({
  RecordCard: ({ record }: { record: { restaurant: { name: string } } }) => (
    <article>{record.restaurant.name}</article>
  ),
}));

afterEach(cleanup);

function record(id: string, name: string): PublicVisitSummary {
  return {
    id,
    slug: `registro-${id}`,
    restaurant: {
      slug: `restaurante-${id}`,
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

describe('RecordGrid', () => {
  it('mantém a ordem pública e limita o stagger por índice', () => {
    const records = [record('a', 'A'), record('b', 'B')];
    render(<RecordGrid records={records} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['A', 'B']);
    expect(items[0]).toHaveAttribute('data-motion', 'excavation');
    expect(items[0]).toHaveAttribute('data-motion-index', '0');
    expect(items[1]).toHaveAttribute('data-motion-index', '1');
  });
});
