// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

const deps = vi.hoisted(() => ({ member: vi.fn(), admin: vi.fn(), query: vi.fn(), put: vi.fn(), del: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth/access', () => ({ requireMember: deps.member, requireAdmin: deps.admin }));
vi.mock('@/lib/db', () => ({ getDb: () => ({ query: deps.query }) }));
vi.mock('@vercel/blob', () => ({ put: deps.put, del: deps.del }));
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidate }));
import { saveProfileAction, setMemberTitleAction } from './profile-actions';

const id = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
function form(values: Record<string, string> = {}) {
  const data = new FormData();
  data.set('bio', 'Gosto de mesas longas.');
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
describe('edição de perfil e cargos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    deps.member.mockResolvedValue({ id, slug: 'ana', role: 'member' });
    deps.admin.mockResolvedValue({ id, role: 'admin' });
    deps.query.mockResolvedValue([{ slug: 'ana', avatar_url: null }]);
  });
  it('ignora alvo, cargo, papel e URL forjados na edição pessoal', async () => {
    expect((await saveProfileAction(form({ memberId: target, societyTitle: 'Monarca', role: 'admin', avatarUrl: 'https://evil.test/a' }))).error).toBeNull();
    const [sql, values] = deps.query.mock.calls[0];
    expect(values).toEqual([id, 'Gosto de mesas longas.', false, null]);
    expect(sql).not.toMatch(/SET\s+(role|society_title)/i);
    expect(sql).toContain('removed_at IS NULL');
  });
  it('aceita descrição vazia e rejeita descrição longa sem gravar', async () => {
    expect((await saveProfileAction(form({ bio: '' }))).error).toBeNull();
    deps.query.mockClear();
    expect((await saveProfileAction(form({ bio: 'a'.repeat(281) }))).error).toBeTruthy();
    expect(deps.query).not.toHaveBeenCalled();
  });
  it('recusa sessão inválida sem upload nem gravação', async () => {
    deps.member.mockRejectedValue(new Error('private session details'));
    const result = await saveProfileAction(form());
    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain('private');
    expect(deps.query).not.toHaveBeenCalled();
    expect(deps.put).not.toHaveBeenCalled();
  });
  it('recusa arquivos falsos ou grandes antes do Blob', async () => {
    for (const file of [new File(['not webp'], 'a.webp', { type: 'image/webp' }), new File([new Uint8Array(750001)], 'a.webp', { type: 'image/webp' })]) {
      const data = form(); data.set('photo', file);
      expect((await saveProfileAction(data)).error).toBeTruthy();
    }
    expect(deps.put).not.toHaveBeenCalled();
    expect(deps.query).not.toHaveBeenCalled();
  });
  it('salva foto validada no caminho do próprio integrante', async () => {
    const bytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#c85f35' } }).webp().toBuffer();
    const data = form(); data.set('photo', new File([new Uint8Array(bytes)], 'photo.webp', { type: 'image/webp' }));
    deps.put.mockResolvedValue({ url: `https://demo.public.blob.vercel-storage.com/members/${id}/photo.webp`, pathname: `members/${id}/photo.webp` });
    expect((await saveProfileAction(data)).error).toBeNull();
    expect(deps.put.mock.calls[0][0]).toMatch(new RegExp(`^members/${id}/.+\\.webp$`));
    expect(deps.query.mock.calls[0][1]).toEqual([id, 'Gosto de mesas longas.', true, `https://demo.public.blob.vercel-storage.com/members/${id}/photo.webp`]);
  });
  it('não declara sucesso para integrante removido entre autenticação e gravação', async () => {
    deps.query.mockResolvedValue([]);
    expect((await saveProfileAction(form())).error).toBeTruthy();
  });
  it('permite retirar a foto sem apagar a descrição', async () => {
    expect((await saveProfileAction(form({ removePhoto: 'true' }))).error).toBeNull();
    expect(deps.query.mock.calls[0][1]).toEqual([id, 'Gosto de mesas longas.', true, null]);
  });
  it('limpa somente foto antiga do próprio integrante após salvar', async () => {
    const own = `https://demo.public.blob.vercel-storage.com/members/${id}/old.webp`;
    deps.query.mockResolvedValueOnce([{ avatar_url: null, old_avatar_url: own }]);
    expect((await saveProfileAction(form({ removePhoto: 'true' }))).error).toBeNull();
    expect(deps.del).toHaveBeenCalledWith(own);
    deps.del.mockClear();
    deps.query.mockResolvedValueOnce([{ avatar_url: null, old_avatar_url: `https://demo.public.blob.vercel-storage.com/members/${target}/old.webp` }]);
    await saveProfileAction(form({ removePhoto: 'true' }));
    expect(deps.del).not.toHaveBeenCalled();
  });
  it('não transforma falha de limpeza em falha de salvamento', async () => {
    deps.query.mockResolvedValue([{ avatar_url: null, old_avatar_url: `https://demo.public.blob.vercel-storage.com/members/${id}/old.webp` }]);
    deps.del.mockRejectedValue(new Error('cleanup unavailable'));
    expect((await saveProfileAction(form({ removePhoto: 'true' }))).error).toBeNull();
  });
  it('exige administrador para atribuir cargo', async () => {
    deps.admin.mockRejectedValue(new Error('forbidden'));
    expect((await setMemberTitleAction(form({ memberId: target, societyTitle: 'Guardião' }))).error).toBeTruthy();
    expect(deps.query).not.toHaveBeenCalled();
  });
  it('atualiza somente o cargo e verifica novamente o administrador no banco', async () => {
    expect((await setMemberTitleAction(form({ memberId: target, societyTitle: '  Guardião  ' }))).error).toBeNull();
    expect(deps.query.mock.calls[0][1]).toEqual([id, target, 'Guardião']);
    expect(deps.query.mock.calls[0][0]).toContain("actor.role = 'admin'");
    expect(deps.revalidate).toHaveBeenCalledWith('/membros/[slug]', 'page');
  });
  it('valida tamanho e identificador do cargo e permite removê-lo', async () => {
    expect((await setMemberTitleAction(form({ memberId: 'invalid', societyTitle: 'Guardião' }))).error).toBeTruthy();
    expect((await setMemberTitleAction(form({ memberId: target, societyTitle: 'x'.repeat(61) }))).error).toBeTruthy();
    expect(deps.query).not.toHaveBeenCalled();
    expect((await setMemberTitleAction(form({ memberId: target, societyTitle: '' }))).error).toBeNull();
    expect(deps.query.mock.calls[0][1]).toEqual([id, target, null]);
  });
});
