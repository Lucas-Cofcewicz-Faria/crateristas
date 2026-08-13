import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { DashboardVisitItem } from './PendingVisitList';
import { PendingVisitList } from './PendingVisitList';

afterEach(cleanup);

const visits: DashboardVisitItem[] = [{
  id: 'visit-1',
  restaurantName: 'Casa da Cratera',
  visitedAt: '2026-08-10T00:00:00.000Z',
  participantCount: 5,
  quorum: 6,
  hasSubmitted: false,
  publicationState: 'private',
}, {
  id: 'visit-2',
  restaurantName: 'Mesa Publicada',
  visitedAt: '2026-08-08T00:00:00.000Z',
  participantCount: 6,
  quorum: 6,
  hasSubmitted: false,
  publicationState: 'published',
}];

describe('PendingVisitList', () => {
  it('apresenta contribuição, quórum, estado centralizado e avaliação real', () => {
    render(<PendingVisitList emptyMessage="Sem pendências." visits={visits} />);

    const first = screen.getByRole('listitem', { name: 'Visita à Casa da Cratera' });
    expect(within(first).getByText('5 de 6 avaliações')).toBeInTheDocument();
    expect(within(first).getByText('Em formação')).toBeInTheDocument();
    expect(within(first).getByRole('link', { name: 'Avaliar Casa da Cratera' }))
      .toHaveAttribute('href', '/visitas/visit-1/avaliar');

    const published = screen.getByRole('listitem', { name: 'Visita à Mesa Publicada' });
    expect(within(published).getByText('Publicada')).toBeInTheDocument();
  });

  it('mantém o vazio explícito sem fabricar cartões', () => {
    render(<PendingVisitList emptyMessage="Nenhuma visita aguarda sua avaliação." visits={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhuma visita aguarda sua avaliação.',
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
