import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DashboardView } from './DashboardView';

afterEach(cleanup);

const pending = [{
  id: 'visit-pending',
  slug: 'pendente',
  restaurantName: 'Mesa Pendente',
  visitedAt: '2026-08-10',
  participantCount: 2,
  quorum: 6,
  hasSubmitted: false,
  publicationState: 'private' as const,
}];

const recent = [{
  id: 'visit-public',
  slug: 'publicada',
  restaurantName: 'Mesa Publicada',
  visitedAt: '2026-08-09',
  participantCount: 1,
}];

const managed = [{
  id: 'visit-hidden',
  slug: 'mesa-oculta',
  restaurantName: 'Mesa Oculta',
  visitedAt: '2026-08-08',
  participantCount: 3,
  quorum: 6,
  publicationState: 'hidden' as const,
}];

describe('DashboardView', () => {
  it('mostra as três filas com contagens reais e a criação de visita', () => {
    render(
      <DashboardView
        awaiting={pending}
        forming={[]}
        isAdmin={false}
        managed={[]}
        memberName="Ana"
        recent={recent}
      />,
    );

    expect(screen.getByRole('link', { name: 'Nova visita' }))
      .toHaveAttribute('href', '/visitas/nova');
    const awaitingSection = screen.getByRole('region', { name: 'Aguardando sua avaliação' });
    const formingSection = screen.getByRole('region', { name: 'Em formação' });
    const recentSection = screen.getByRole('region', { name: 'Publicadas recentemente' });
    expect(within(awaitingSection).getByLabelText('1 item')).toBeInTheDocument();
    expect(within(formingSection).getByLabelText('0 itens')).toBeInTheDocument();
    expect(within(recentSection).getByLabelText('1 item')).toBeInTheDocument();
    expect(formingSection).toHaveTextContent('Nenhuma visita está em formação.');
    expect(within(recentSection).getByText(/1 avaliação · visita em/)).toBeInTheDocument();
    expect(within(recentSection).getByRole('link', { name: 'Abrir Mesa Publicada' }))
      .toHaveAttribute('href', '/restaurantes/publicada');
    expect(screen.queryByText(/administrador|administração/i)).not.toBeInTheDocument();
  });

  it('identifica o papel administrativo sem expor controles inexistentes', () => {
    render(
      <DashboardView
        awaiting={[]}
        forming={[]}
        isAdmin
        managed={managed}
        memberName="Bia"
        recent={[]}
      />,
    );

    expect(screen.getByText('Administrador')).toBeInTheDocument();
    const management = screen.getByRole('region', { name: 'Gerenciar reviews' });
    expect(within(management).getByText('Mesa Oculta')).toBeInTheDocument();
    expect(within(management).getByText('Oculta')).toBeInTheDocument();
    expect(within(management).getByText('3 avaliações serão apagadas em uma exclusão'))
      .toBeInTheDocument();
    expect(within(management).getByRole('link', { name: 'Gerenciar Mesa Oculta' }))
      .toHaveAttribute('href', '/visitas/visit-hidden/avaliar');
  });
});
