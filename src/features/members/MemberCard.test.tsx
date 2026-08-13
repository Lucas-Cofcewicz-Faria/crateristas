import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemberCard, type MemberCardProps } from './MemberCard';

afterEach(cleanup);

const member: MemberCardProps = {
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
  it('mostra somente o resumo público antes da expansão', () => {
    render(<MemberCard {...member} />);

    expect(screen.getByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument();
    expect(screen.getByText('Guardiã das Mesas Longas')).toBeInTheDocument();
    expect(screen.getByText('Craterista nº 03')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Marca discreta da Sociedade Crateristas' }))
      .toBeInTheDocument();
    expect(screen.getByText('12 contribuições públicas')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Retrato de Ana Souza' })).toBeInTheDocument();

    const details = screen.getByRole('region', { hidden: true });
    expect(details).toHaveAttribute('aria-label', 'Detalhes de Ana Souza');
    expect(details).not.toBeVisible();
    expect(document.body).not.toHaveTextContent(/e-mail|auth_user_id|administrador|nota individual/i);
  });

  it('expande os detalhes por um botão real e mantém o painel associado', async () => {
    const user = userEvent.setup();
    render(<MemberCard {...member} />);

    const button = screen.getByRole('button', { name: 'Conhecer Ana Souza' });
    const panelId = button.getAttribute('aria-controls');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panelId).toBeTruthy();

    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Detalhes de Ana Souza' }))
      .toHaveAttribute('id', panelId);
    expect(screen.getByText(member.bio)).toBeVisible();
    expect(screen.getByText('Culinária favorita: Brasileira')).toBeVisible();
  });

  it('usa iniciais quando não recebe uma foto confiável', () => {
    render(<MemberCard {...member} avatarUrl={null} displayName="Bruno Lima" />);

    expect(screen.queryByRole('img', { name: 'Retrato de Bruno Lima' })).not.toBeInTheDocument();
    expect(screen.getByText('BL')).toBeInTheDocument();
  });
});
