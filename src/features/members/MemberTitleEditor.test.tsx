import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({ save: vi.fn(), refresh: vi.fn() }));
vi.mock('./profile-actions', () => ({ setMemberTitleAction: deps.save }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: deps.refresh }) }));
import { MemberTitleEditor } from './MemberTitleEditor';
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it('envia o cargo do integrante escolhido e permite retirar o título', async () => {
  deps.save.mockResolvedValue({ error: null });
  render(<MemberTitleEditor memberId="ana" displayName="Ana" societyTitle="Guardiã" />);
  fireEvent.click(screen.getByText('Definir cargo de Ana'));
  fireEvent.change(screen.getByLabelText('Cargo oficial'), { target: { value: '' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Cargo de Ana' }));
  await waitFor(() => expect(deps.refresh).toHaveBeenCalledOnce());
  expect(deps.save.mock.calls[0][0].get('memberId')).toBe('ana');
  expect(deps.save.mock.calls[0][0].get('societyTitle')).toBe('');
  expect(screen.getByRole('status')).toHaveTextContent('Cargo atualizado');
});
it('mantém cargo digitado e informa falha sem anunciar sucesso', async () => {
  deps.save.mockResolvedValue({ error: 'Sem permissão.' });
  render(<MemberTitleEditor memberId="ana" displayName="Ana" societyTitle={null} />);
  fireEvent.change(screen.getByLabelText('Cargo oficial'), { target: { value: 'Guardiã' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Cargo de Ana', hidden: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sem permissão.');
  expect(screen.getByLabelText('Cargo oficial')).toHaveValue('Guardiã');
  expect(deps.refresh).not.toHaveBeenCalled();
});
