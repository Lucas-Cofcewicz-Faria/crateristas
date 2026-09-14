import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemberCard, type MemberCardProps } from './MemberCard';

afterEach(cleanup);

const member: MemberCardProps = {
  slug: 'ana-souza',
  avatarUrl: 'https://crateristas.public.blob.vercel-storage.com/members/ana-souza.jpg',
  bio: 'Guarda lembranças de mesas longas e conversas ainda maiores.',
  displayName: 'Ana Souza',
  favoriteCuisine: 'Brasileira',
  memberNumber: 3,
  publicContributionCount: 12,
  societyTitle: 'Guardiã das Mesas Longas',
  societyFragment: {
    id: 'arquivo-03',
    text: 'Há mesas que deixam uma cadeira vazia para a memória.',
  },
};

describe('MemberCard', () => {
  it('usa Integrante quando o administrador ainda não atribuiu cargo', () => {
    render(<MemberCard {...member} societyTitle={null} />);
    expect(screen.getByText('Integrante')).toBeVisible();
  });
  it('mostra somente o resumo público antes da expansão', () => {
    render(<MemberCard {...member} />);

    expect(screen.getByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument();
    expect(screen.getByText('Guardiã das Mesas Longas')).toBeInTheDocument();
    expect(screen.getByText('Craterista nº 03')).toBeInTheDocument();
    expect(screen.getByText('12 contribuições públicas')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Retrato de Ana Souza' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Conhecer Ana Souza' })).toHaveAttribute('href', '/membros/ana-souza');
    expect(document.body).not.toHaveTextContent(/e-mail|auth_user_id|administrador|nota individual/i);
  });

  it('faz a foto e a identidade participarem do mesmo link público', () => {
    render(<MemberCard {...member} />);

    const link = screen.getByRole('link', { name: 'Conhecer Ana Souza' });
    expect(link).toContainElement(screen.getByRole('img', { name: 'Retrato de Ana Souza' }));
    expect(link).toContainElement(screen.getByRole('heading', { name: 'Ana Souza' }));
  });

  it('usa iniciais quando não recebe uma foto confiável', () => {
    render(<MemberCard {...member} avatarUrl={null} displayName="Bruno Lima" />);

    expect(screen.queryByRole('img', { name: 'Retrato de Bruno Lima' })).not.toBeInTheDocument();
    expect(screen.getByText('BL')).toBeInTheDocument();
  });

  it('preserva o espaço do retrato e usa iniciais quando a imagem falha', () => {
    render(<MemberCard {...member} />);
    fireEvent.error(screen.getByRole('img', { name: 'Retrato de Ana Souza' }));
    expect(screen.queryByRole('img', { name: 'Retrato de Ana Souza' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Iniciais de Ana Souza: AS' })).toBeInTheDocument();
  });
});
