import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const remove = vi.hoisted(() => vi.fn());
vi.mock('./member-actions', () => ({ removeMemberAction: remove }));
vi.mock('./profile-actions', () => ({ setMemberTitleAction: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { MemberManager } from './MemberManager';
const members = [
  { id: 'admin', displayName: 'Guizão', avatarUrl: null, role: 'admin' as const, scorecardCount: 3, removedAt: null },
  { id: 'member', displayName: 'Ana', avatarUrl: null, role: 'member' as const, scorecardCount: 2, removedAt: null },
];
afterEach(cleanup);
beforeEach(() => { remove.mockReset(); remove.mockResolvedValue({ error: null }); });
describe('gestão de integrantes no painel', () => {
  it('exibe somente integrantes ativos, sem uma lista de removidos', () => {
    render(<MemberManager members={[...members, {
      id: 'removed', displayName: 'Integrante antigo', avatarUrl: null,
      role: 'member', scorecardCount: 1, removedAt: '2026-09-01T00:00:00Z',
    }]} currentMemberId="admin" />);
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.getByText('2 ativos')).toBeInTheDocument();
    expect(screen.queryByText('Integrante antigo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Integrantes removidos/)).not.toBeInTheDocument();
  });
  it('mostra o estado vazio quando só há integrantes removidos', () => {
    render(<MemberManager members={members.map((member) => ({
      ...member, removedAt: '2026-09-01T00:00:00Z',
    }))} currentMemberId="admin" />);
    expect(screen.getByText('Nenhum integrante ativo.')).toBeInTheDocument();
    expect(screen.getByText('0 ativos')).toBeInTheDocument();
    expect(screen.queryByText(/Integrantes removidos/)).not.toBeInTheDocument();
  });
  it('mostra impacto antes da confirmação e protege administradores', async () => {
    const user = userEvent.setup();
    render(<MemberManager members={members} currentMemberId="admin" />);
    expect(screen.queryByRole('button', { name: 'Remover Guizão' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    const form = screen.getByRole('form', { name: 'Remover Ana' });
    expect(form).toHaveTextContent('2 avaliações');
    expect(form).toHaveTextContent('preservadas');
    const confirm = within(form).getByRole('button', { name: 'Confirmar remoção' });
    expect(confirm).toBeDisabled();
    await user.type(within(form).getByRole('textbox'), 'Remover integrante');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(await screen.findByRole('status')).toHaveTextContent('Ana foi removido');
    expect(screen.queryByRole('button', { name: 'Remover Ana' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Integrantes removidos/)).not.toBeInTheDocument();
    expect(screen.getByText('1 ativo')).toBeInTheDocument();
    expect(remove.mock.calls[0][0].get('memberId')).toBe('member');
  });
  it('cancelar não remove; falha mantém a confirmação disponível', async () => {
    const user = userEvent.setup();
    render(<MemberManager members={members} currentMemberId="admin" />);
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    await user.type(within(screen.getByRole('form', { name: 'Remover Ana' })).getByRole('textbox'), 'Remover integrante');
    remove.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente');
    expect(screen.getByRole('button', { name: 'Confirmar remoção' })).toBeEnabled();
  });
});
