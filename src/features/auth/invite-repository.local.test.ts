// Opt-in: a disposable local PostgreSQL cluster on port 55439, never DATABASE_URL.
// Apply migrations 001, 003, 004 and 005 before running with CRATERISTAS_LOCAL_PG_TESTS=1.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

const local = vi.hoisted(() => ({ client: {} as unknown }));
vi.mock('@/lib/db', () => ({ getDb: () => local.client }));
import { beginEnrollment, finishEnrollment, validateSharedInvite, readSharedInvite, changeSharedInvite, isInvitedEmail } from './invite-repository';
import { createNeonReviewRepository, type ReviewSqlClient } from '@/lib/repositories/neon-review-repository';
import { createReviewService } from '@/domain/reviews/service';

function csv(text: string): Record<string, unknown>[] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (char === ',' || char === '\n')) {
      row.push(cell.replace(/\r$/, '')); cell = '';
      if (char === '\n') { if (row.some(Boolean)) rows.push(row); row = []; }
    } else cell += char;
  }
  const [headers, ...values] = rows;
  return values.map((values) => Object.fromEntries(headers.map((key, i) => [key,
    ['photos', 'comments'].includes(key) ? JSON.parse(values[i])
      : values[i] === '{}' ? []
      : values[i] === 't' ? true : values[i] === 'f' ? false : values[i] === '__NULL__' ? null : values[i]])));
}

type Query = { text: string; params: unknown[] };
function execute(queries: Query[]) {
  const statements = queries.map(({ text, params }, index) => {
    const values = params.map((value) => value == null ? 'NULL' : Array.isArray(value) && value.length === 0 ? "'{}'::text[]" : typeof value === 'boolean' ? String(value) : `'${String(value).replaceAll("'", "''")}'`).join(',');
    return `PREPARE qa_${index} AS ${text};\nEXECUTE qa_${index}${params.length ? `(${values})` : ''};\nDEALLOCATE qa_${index};\n\\echo __CRATERISTAS_QUERY_END__`;
  });
  const output = execFileSync('psql', ['-X', '-q', '--csv', '-P', 'null=__NULL__', '-h', '127.0.0.1', '-p', '55439', '-U', 'crateristas_qa', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], {
    input: `BEGIN;\n${statements.join('\n')}\nCOMMIT;\n`, encoding: 'utf8', windowsHide: true,
  });
  return output.split('__CRATERISTAS_QUERY_END__').slice(0, queries.length).map((part) => csv(part.trim() + '\n'));
}
const query = async (text: string, params: unknown[] = []) => execute([{ text, params }])[0];
local.client = { query, transaction: async (factory: (tx: { query: (text: string, params?: unknown[]) => Query }) => Query[]) => execute(factory({ query: (text, params = []) => ({ text, params }) })) };

describe.skipIf(process.env.CRATERISTAS_LOCAL_PG_TESTS !== '1')('cadastro e publicação no PostgreSQL local descartável', () => {
  it('valida convite reutilizável, vínculo idempotente, revogação e integrante acima de oito', async () => {
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', 'synthetic-local-testing-secret-not-for-production');
    const admin = randomUUID();
    await query(`INSERT INTO members (id, auth_user_id, email, slug, display_name, role) VALUES ($1::uuid, $1::text, $2, $1::text, 'Administrador sintético', 'admin')`, [admin, `${admin}@example.com`]);
    await changeSharedInvite(admin, 'replace');
    const invite = await readSharedInvite();
    expect(invite.active).toBe(true);
    expect(await validateSharedInvite(invite.token!)).toBeTruthy();
    for (let i = 0; i < 9; i++) {
      const user = { id: randomUUID(), email: `${randomUUID()}@example.com` };
      const receipt = await beginEnrollment(invite.token!, user.email, `Craterista sintético ${i}`);
      expect(await isInvitedEmail(user.email)).toBe(true);
      expect(await finishEnrollment(receipt, { ...user, email: 'wrong@example.com' })).toBe(false);
      expect(await finishEnrollment(receipt, user)).toBe(true);
      expect(await finishEnrollment(receipt, user)).toBe(true);
      expect(await isInvitedEmail(user.email)).toBe(false);
      const [member] = await query('SELECT role, member_number FROM members WHERE auth_user_id = $1', [user.id]);
      expect(member.role).toBe('member');
      if (i === 8) expect(Number(member.member_number)).toBeGreaterThan(8);
    }
    const waiting = { id: randomUUID(), email: `${randomUUID()}@example.com` };
    const receipt = await beginEnrollment(invite.token!, waiting.email, 'Cadastro interrompido');
    await changeSharedInvite(admin, 'disable');
    expect(await validateSharedInvite(invite.token!)).toBeNull();
    expect(await isInvitedEmail(waiting.email)).toBe(false);
    expect(await finishEnrollment(receipt, waiting)).toBe(false);
    await expect(changeSharedInvite(waiting.id, 'replace')).rejects.toThrow();
    vi.unstubAllEnvs();
  }, 20000);

  it('salvar nove notas não publica; publicação manual mantém futuras notas e médias', async () => {
    const repository = createNeonReviewRepository(local.client as ReviewSqlClient);
    const people = await query('SELECT id FROM members ORDER BY member_number LIMIT 9');
    const visit = await repository.createVisit(String(people[0].id), { restaurantName: `Restaurante sintético ${randomUUID()}`, cuisine: 'Teste', neighborhood: 'Teste', city: 'Teste', visitedAt: '2026-09-06' });
    const scorecard = { food: 8, service: 8, ambience: 8, value: 8, access: 8, waitTime: 8, comment: 'Avaliação sintética.' };
    for (const member of people) {
      const saved = await repository.submitScorecardAtomically({ visitId: visit.id, memberId: String(member.id), scorecard });
      expect(saved.publicationState).toBe('private');
      expect(saved.publicationChanged).toBe(false);
    }
    await repository.changePublicationAtomically({ visitId: visit.id, actorId: String(people[0].id), expectedPublicationState: 'private', state: 'published', reason: 'admin_override', action: 'publish_early' });
    const saved = await repository.submitScorecardAtomically({ visitId: visit.id, memberId: String(people[1].id), scorecard: { ...scorecard, food: 2 } });
    expect(saved.publicationState).toBe('published');
    expect(saved.participantCount).toBe(9);
    expect(saved.aggregate.averages?.food).toBe(7.3);
  });

  it('exercita criação, prato, fotos, permissões, ocultação e exclusão sem tocar no Neon', async () => {
    const repository = createNeonReviewRepository(local.client as ReviewSqlClient);
    const service = createReviewService(repository);
    const [adminRow] = await query("SELECT id FROM members WHERE role = 'admin' LIMIT 1");
    const [memberRow] = await query("SELECT id FROM members WHERE role = 'member' LIMIT 1");
    const admin = (await repository.findMemberById(String(adminRow.id)))!;
    const member = (await repository.findMemberById(String(memberRow.id)))!;
    const visit = await service.createVisit(admin, { restaurantName: `Fluxo sintético ${randomUUID()}`, cuisine: 'Teste', neighborhood: 'Teste', city: 'Teste', visitedAt: '2026-09-06' });
    expect(await repository.getPublicVisitBySlug(visit.slug)).toBeNull();
    await service.submitScorecard(member, visit.id, { food: 8, service: 7, ambience: 6, value: 9, access: 5, waitTime: 7, comment: 'Comentário sintético', dish: 'Prato sintético' });
    await expect(service.changePublication(member, visit.id, 'publish_early')).rejects.toThrow();
    await expect(service.authorizePhotoUpload(member, visit.id)).rejects.toThrow();
    const pathname = `qa/${randomUUID()}.webp`;
    const photoInput = { url: `https://example.invalid/${pathname}`, pathname, contentType: 'image/webp' as const, sizeBytes: 1000 };
    await service.attachPhoto(admin, visit.id, photoInput);
    expect(await repository.countVisitPhotos(visit.id)).toBe(1);
    await service.changePublication(admin, visit.id, 'publish_early');
    const published = (await repository.getPublicVisitBySlug(visit.slug))!;
    expect(published.comments[0]).toMatchObject({ dish: 'Prato sintético', comment: 'Comentário sintético', scores: { food: 8 } });
    expect(published.photos).toHaveLength(1);
    expect(published.coverPhotoUrl).toBe(photoInput.url);
    expect(JSON.stringify(published)).not.toContain(member.email);
    await service.changePublication(admin, visit.id, 'hide');
    expect(await repository.getPublicVisitBySlug(visit.slug)).toBeNull();
    await service.changePublication(admin, visit.id, 'republish');
    expect(await repository.getPublicVisitBySlug(visit.slug)).not.toBeNull();
    await service.removePhoto(admin, visit.id, published.photos[0].id);
    expect(await repository.countVisitPhotos(visit.id)).toBe(0);
    await expect(service.prepareVisitDeletion(member, visit.id, 1)).rejects.toThrow();
    const target = await service.prepareVisitDeletion(admin, visit.id, 1);
    expect(target?.participantCount).toBe(1);
    expect(await service.deleteVisit(admin, visit.id, [])).toBe(true);
    expect(await repository.findVisitById(visit.id)).toBeNull();
  }, 20000);

  it('remove acesso e diretório sem perder histórico, nem permitir reentrada por comprovante antigo', async () => {
    const { listManagedMembers, removeMember } = await import('@/features/members/member-administration');
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', 'synthetic-local-testing-secret-not-for-production');
    const repository = createNeonReviewRepository(local.client as ReviewSqlClient);
    const [adminRow] = await query("SELECT id FROM members WHERE role = 'admin' LIMIT 1");
    const admin = String(adminRow.id);
    await changeSharedInvite(admin, 'replace');
    const { token } = await readSharedInvite();
    const user = { id: randomUUID(), email: `${randomUUID()}@example.com` };
    const receipt = await beginEnrollment(token!, user.email, 'Integrante a remover');
    expect(await finishEnrollment(receipt, user)).toBe(true);
    const member = (await repository.findMemberByAuthUserId(user.id))!;
    const visit = await repository.createVisit(member.id, { restaurantName: `Arquivo ${randomUUID()}`, cuisine: 'Teste', neighborhood: 'Teste', city: 'Teste', visitedAt: '2026-09-08' });
    await repository.submitScorecardAtomically({ visitId: visit.id, memberId: member.id, scorecard: { food: 8, service: 8, ambience: 8, value: 8, access: 8, waitTime: 8, comment: 'Preservar comentário', dish: 'Frango' } });
    await query("INSERT INTO visit_photos (visit_id, uploaded_by, url, pathname, position) VALUES ($1, $2, 'https://example.invalid/photo.webp', $3, 1)", [visit.id, member.id, randomUUID()]);
    await repository.changePublicationAtomically({ visitId: visit.id, actorId: admin, expectedPublicationState: 'private', state: 'published', reason: 'admin_override', action: 'publish_early' });
    const before = await repository.getPublicVisitBySlug(visit.slug);
    const publicCount = (await repository.listPublicMembers()).length;
    expect(await listManagedMembers(member.id)).toEqual([]);
    expect((await listManagedMembers(admin)).find((item) => item.id === member.id)?.scorecardCount).toBe(1);
    expect(await removeMember(member.id, admin)).toBe(false);
    expect(await removeMember(admin, admin)).toBe(false);
    expect(await removeMember(admin, member.id)).toBe(true);
    expect(await removeMember(admin, member.id)).toBe(false);
    expect(await repository.findMemberByAuthUserId(user.id)).toBeNull();
    expect(await repository.findMemberById(member.id)).toBeNull();
    expect(await repository.listPublicMembers()).toHaveLength(publicCount - 1);
    expect(await repository.getPublicVisitBySlug(visit.slug)).toEqual(before);
    expect(await isInvitedEmail(user.email)).toBe(false);
    expect(await finishEnrollment(receipt, user)).toBe(false);
    await expect(beginEnrollment(token!, user.email, 'Retorno')).rejects.toThrow();
    expect((await listManagedMembers(admin)).find((item) => item.id === member.id)?.removedAt).toBeTruthy();
    vi.unstubAllEnvs();
  }, 20000);
});
