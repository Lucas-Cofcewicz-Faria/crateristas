import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({ admin: vi.fn(), remove: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ requireAdmin: deps.admin }));
vi.mock('./member-administration', () => ({ removeMember: deps.remove }));
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidate }));
import { removeMemberAction } from './member-actions';

const actor = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
function form(id = target, confirmation = 'Remover integrante') {
  const data = new FormData();
  data.set('memberId', id);
  data.set('confirmation', confirmation);
  return data;
}
describe('remoção administrativa de integrantes', () => {
  beforeEach(() => { vi.resetAllMocks(); deps.admin.mockResolvedValue({ id: actor, role: 'admin' }); deps.remove.mockResolvedValue(true); });
  it('recusa acesso sem administrador antes de alterar dados', async () => {
    deps.admin.mockRejectedValue(new Error('Não autorizado'));
    expect((await removeMemberAction(form())).error).toBeTruthy();
    expect(deps.remove).not.toHaveBeenCalled();
  });
  it.each([['invalid', 'Remover integrante'], [target, 'remover integrante'], [target, '']])('valida alvo e confirmação no servidor', async (id, confirmation) => {
    expect((await removeMemberAction(form(id, confirmation))).error).toBeTruthy();
    expect(deps.remove).not.toHaveBeenCalled();
  });
  it('protege a própria conta mesmo com confirmação válida', async () => {
    expect((await removeMemberAction(form(actor))).error).toBeTruthy();
    expect(deps.remove).not.toHaveBeenCalled();
  });
  it('usa o administrador autenticado e atualiza painel e diretório público', async () => {
    expect(await removeMemberAction(form())).toEqual({ error: null });
    expect(deps.remove).toHaveBeenCalledWith(actor, target);
    for (const path of ['/painel', '/home', '/historia']) expect(deps.revalidate).toHaveBeenCalledWith(path);
  });
  it('não informa sucesso quando o alvo é protegido ou já removido', async () => {
    deps.remove.mockResolvedValue(false);
    expect((await removeMemberAction(form())).error).toBeTruthy();
  });
  it('não expõe detalhes internos em falhas do banco', async () => {
    deps.remove.mockRejectedValue(new Error('sensitive database details'));
    const result = await removeMemberAction(form());
    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain('sensitive');
  });
});
