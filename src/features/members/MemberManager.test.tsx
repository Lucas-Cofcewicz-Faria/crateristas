import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const remove = vi.hoisted(() => vi.fn());
vi.mock('./member-actions', () => ({ removeMemberAction: remove }));
import { MemberManager } from './MemberManager';
const members = [
  { id: 'admin', displayName: 'Guizão', avatarUrl: null, role: 'admin' as const, scorecardCount: 3, removedAt: null },
  { id: 'member', displayName: 'Ana', avatarUrl: null, role: 'member' as const, scorecardCount: 2, removedAt: null },
];
afterEach(cleanup);
beforeEach(() => { remove.mockReset(); remove.mockResolvedValue({ error: null }); });
describe('gestão de integrantes no painel', () => {
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
    expect(remove.mock.calls[0][0].get('memberId')).toBe('member');
  });
  it('cancelar não remove; falha mantém a confirmação disponível', async () => {
    const user = userEvent.setup();
    render(<MemberManager members={members} currentMemberId="admin" />);
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Remover Ana' }));
    await user.type(screen.getByRole('textbox'), 'Remover integrante');
    remove.mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente novamente');
    expect(screen.getByRole('button', { name: 'Confirmar remoção' })).toBeEnabled();
  });
});
