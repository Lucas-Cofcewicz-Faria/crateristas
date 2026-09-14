import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({ viewer: vi.fn(), members: vi.fn(), logout: vi.fn(), redirect: vi.fn(), notFound: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ findOptionalMember: deps.viewer }));
vi.mock('@/lib/reviews/server', () => ({ getReviewRepository: () => ({ listPublicMembers: deps.members }) }));
vi.mock('@/features/auth/actions', () => ({ logoutAction: deps.logout }));
vi.mock('./profile-actions', () => ({ saveProfileAction: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/perfil', useRouter: () => ({ refresh: vi.fn() }), redirect: deps.redirect, notFound: deps.notFound }));
import ProfilePage from '@/app/(site)/perfil/page';
import MemberProfilePage from '@/app/(site)/membros/[slug]/page';
const publicMember = { slug: 'ana', displayName: 'Ana', avatarUrl: null, bio: 'Parte da sociedade.', societyTitle: 'Guardiã', memberNumber: 3, favoriteCuisine: null, contributions: { publishedVisits: 2, scorecards: 2 } };
beforeEach(() => {
  vi.resetAllMocks();
  deps.viewer.mockResolvedValue(null);
  deps.members.mockResolvedValue([publicMember]);
  deps.redirect.mockImplementation(() => { throw new Error('redirect'); });
  deps.notFound.mockImplementation(() => { throw new Error('not found'); });
});
afterEach(cleanup);
it('publica o perfil para visitantes sem oferecer edição', async () => {
  render(await MemberProfilePage({ params: Promise.resolve({ slug: 'ana' }) }));
  expect(screen.getByRole('heading', { name: 'Ana' })).toBeVisible();
  expect(screen.getByText('Guardiã')).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Editar meu perfil' })).not.toBeInTheDocument();
});
it('não publica integrante ausente ou removido do diretório', async () => {
  await expect(MemberProfilePage({ params: Promise.resolve({ slug: 'removido' }) })).rejects.toThrow('not found');
});
it('direciona visitante sem sessão para entrar', async () => {
  await expect(ProfilePage()).rejects.toThrow('redirect');
  expect(deps.redirect).toHaveBeenCalledWith('/entrar');
});
it('permite sair pela página pessoal sem expor e-mail no HTML', async () => {
  deps.viewer.mockResolvedValue({ ...publicMember, id: 'a', authUserId: 'auth-secret', email: 'private@example.com', role: 'member' });
  render(await ProfilePage());
  expect(document.body).not.toHaveTextContent('private@example.com');
  expect(document.body).not.toHaveTextContent('auth-secret');
  fireEvent.submit(screen.getByRole('button', { name: 'Sair da plataforma' }).closest('form')!);
  await waitFor(() => expect(deps.logout).toHaveBeenCalledOnce());
});
