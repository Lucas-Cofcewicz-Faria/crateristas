import { beforeEach, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  begin: vi.fn(), finish: vi.fn(), signUp: vi.fn(), session: vi.fn(),
  set: vi.fn(), get: vi.fn(), remove: vi.fn(), admin: vi.fn(), change: vi.fn(), read: vi.fn(), member: vi.fn(),
}));
vi.mock('./invite-repository', () => ({
  beginEnrollment: deps.begin, finishEnrollment: deps.finish,
  ENROLLMENT_COOKIE: 'test-enrollment', ENROLLMENT_MAX_AGE: 604800,
  changeSharedInvite: deps.change, readSharedInvite: deps.read,
}));
vi.mock('@/lib/auth/server', () => ({ auth: { signUp: { email: deps.signUp }, getSession: deps.session } }));
vi.mock('@/lib/auth/access', () => ({ requireAdmin: deps.admin, findOptionalMember: deps.member }));
vi.mock('next/headers', () => ({ cookies: async () => ({ set: deps.set, get: deps.get, delete: deps.remove }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
import { signupAction, manageInviteAction, completeSignupAction } from './signup-actions';

const initial = { error: null, message: null };
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: '  Novo Craterista ', email: ' NOVO@example.com ', password: 'synthetic-password', token: 'link' })) data.set(key, value);
  return data;
}
beforeEach(() => { vi.resetAllMocks(); deps.begin.mockResolvedValue('receipt'); deps.signUp.mockResolvedValue({ data: {}, error: null }); deps.session.mockResolvedValue({ data: null }); });

it('bloqueia o cadastro antes de chamar Neon quando o convite não é válido', async () => {
  deps.begin.mockRejectedValue(new Error('Convite desativado'));
  expect((await signupAction(initial, form())).error).toContain('Convite desativado');
  expect(deps.signUp).not.toHaveBeenCalled();
});
it('envia somente nome, email normalizado e senha ao Neon e orienta a retomada sem sessão', async () => {
  const result = await signupAction(initial, form());
  expect(deps.signUp).toHaveBeenCalledWith({ name: 'Novo Craterista', email: 'novo@example.com', password: 'synthetic-password' });
  expect(result.message).toContain('e-mail');
  expect(deps.finish).not.toHaveBeenCalled();
});
it('não aceita senha curta ou nome vazio', async () => {
  const data = form(); data.set('password', 'abc'); data.set('name', ' ');
  expect((await signupAction(initial, data)).error).toBeTruthy();
  expect(deps.begin).not.toHaveBeenCalled();
});
it('conclui cadastro somente com sessão e comprovante no cookie', async () => {
  deps.get.mockReturnValue({ value: 'receipt' });
  expect((await completeSignupAction(initial)).error).toContain('Entre');
  expect(deps.finish).not.toHaveBeenCalled();
});
it('nega gerenciamento do convite para usuários sem papel de admin', async () => {
  deps.admin.mockRejectedValue(new Error('not admin'));
  expect((await manageInviteAction('replace')).error).toBeTruthy();
  expect(deps.change).not.toHaveBeenCalled();
});

it('um comprovante antigo não bloqueia um integrante já cadastrado', async () => {
  deps.get.mockReturnValue({ value: 'stale-receipt' });
  deps.session.mockResolvedValue({ data: { user: { id: 'existing-user', email: 'member@example.com' } } });
  deps.member.mockResolvedValue({ id: 'existing-member' });
  await expect(completeSignupAction(initial)).rejects.toThrow('redirect:/painel');
  expect(deps.finish).not.toHaveBeenCalled();
  expect(deps.remove).toHaveBeenCalledWith('test-enrollment');
});
