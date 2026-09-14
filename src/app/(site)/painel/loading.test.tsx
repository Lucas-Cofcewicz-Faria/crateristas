import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions', () => ({
  logoutAction: vi.fn(async () => undefined),
}));

import DashboardLoading from './loading';

afterEach(cleanup);

describe('loading do painel privado', () => {
  it('carrega o conteúdo sem substituir a navegação do layout', () => {
    render(<DashboardLoading />);

    expect(screen.getByRole('status')).toHaveTextContent('Preparando seu painel...');
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });
});
