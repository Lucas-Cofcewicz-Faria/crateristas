import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { MembersPreview } from './MembersPreview';

afterEach(cleanup);

it('abre o perfil público pelo mesmo card do diretório, com cargo e contribuições', () => {
  render(<MembersPreview members={[{
    slug: 'ana', displayName: 'Ana', avatarUrl: null, memberNumber: 3,
    societyTitle: 'Guardiã da Cratera', bio: '', favoriteCuisine: null,
    contributions: { publishedVisits: 2, scorecards: 2 },
  }]} />);
  const link = screen.getByRole('link', { name: 'Conhecer Ana' });
  expect(link).toHaveAttribute('href', '/membros/ana');
  expect(within(link).getByText('Guardiã da Cratera')).toBeVisible();
  expect(within(link).getByText('2 contribuições públicas')).toBeVisible();
});
