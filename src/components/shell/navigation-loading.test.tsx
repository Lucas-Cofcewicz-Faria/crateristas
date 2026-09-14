import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicShell } from './PublicShell';
import HomeLoading from '@/app/(site)/home/loading';
import HistoryLoading from '@/app/(site)/historia/loading';
import RecordsLoading from '@/app/(site)/registros/loading';

vi.mock('@/features/auth/actions', () => ({ logoutAction: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/historia' }));
afterEach(cleanup);

describe('navegação sem falso logout', () => {
  it.each([['home', HomeLoading], ['história', HistoryLoading], ['registros', RecordsLoading]] as const)('mantém uma única navbar autenticada durante o carregamento de %s', (_name, Loading) => {
    const view = render(<PublicShell viewer="member"><h1>Página anterior</h1></PublicShell>);
    const header = screen.getByRole('banner');
    const profile = screen.getByRole('link', { name: 'Perfil' });
    view.rerender(<PublicShell viewer="member"><Loading /></PublicShell>);
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getByRole('banner')).toBe(header);
    expect(screen.getByRole('link', { name: 'Perfil' })).toBe(profile);
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
    view.rerender(<PublicShell viewer="member"><h1>História pronta</h1></PublicShell>);
    expect(screen.getByRole('banner')).toBe(header);
  });
});
