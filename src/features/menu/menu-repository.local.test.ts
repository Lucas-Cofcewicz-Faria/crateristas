// Opt-in: uses only the disposable local PostgreSQL cluster on port 55439.
// Apply migrations 001, 003, 004, 005, 006 and 007 before running with
// CRATERISTAS_LOCAL_PG_TESTS=1.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

const local = vi.hoisted(() => ({ client: {} as unknown }));
vi.mock('@/lib/db', () => ({ getDb: () => local.client }));

import {
  attachMenuPhoto,
  canManageMenuPhotos,
  changeMenuPublication,
  createMenuItem,
  findMenuItem,
  saveMenuScore,
} from './menu-repository';
import type { MenuScore } from './menu-types';
import { createNeonReviewRepository, type ReviewSqlClient } from '@/lib/repositories/neon-review-repository';

type Query = { text: string; params: unknown[] };

function csv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (char === ',' || char === '\n')) {
      row.push(cell.replace(/\r$/, ''));
      cell = '';
      if (char === '\n') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else cell += char;
  }
  const [headers, ...values] = rows;
  if (!headers) return [];
  return values.map((values) => Object.fromEntries(headers.map((key, index) => {
    const value = values[index];
    return [key, ['photos', 'comments'].includes(key) ? JSON.parse(value)
      : value === 't' ? true
        : value === 'f' ? false
          : value === '__NULL__' ? null
            : value];
  })));
}

function sqlValue(value: unknown): string {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function script(queries: Query[]): string {
  const statements = queries.map(({ text, params }, index) => {
    const values = params.map(sqlValue).join(',');
    return `PREPARE qa_${index} AS ${text};\nEXECUTE qa_${index}${params.length ? `(${values})` : ''};\nDEALLOCATE qa_${index};\n\\echo __CRATERISTAS_QUERY_END__`;
  });
  return `BEGIN;\n${statements.join('\n')}\nCOMMIT;\n`;
}

function execute(queries: Query[]): Promise<Record<string, unknown>[][]> {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', [
      '-X', '-q', '--csv', '-P', 'null=__NULL__', '-h', '127.0.0.1', '-p', '55439',
      '-U', 'crateristas_qa', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1',
    ], { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `psql exited with code ${code}`));
        return;
      }
      resolve(stdout.split('__CRATERISTAS_QUERY_END__').slice(0, queries.length)
        .map((part) => csv(`${part.trim()}\n`)));
    });
    child.stdin.end(script(queries));
  });
}

const query = async (text: string, params: unknown[] = []) => (await execute([{ text, params }]))[0];
local.client = {
  query,
  transaction: async (factory: (tx: { query: (text: string, params?: unknown[]) => Query }) => Query[]) =>
    execute(factory({ query: (text, params = []) => ({ text, params }) })),
};

const memberIds: string[] = [];
const restaurantIds: string[] = [];

async function member(role: 'member' | 'admin' = 'member') {
  const id = randomUUID();
  memberIds.push(id);
  await query(`INSERT INTO members (id, auth_user_id, email, slug, display_name, role)
    VALUES ($1, $2, $3, $4, $5, $6)`,
  [id, `auth-${id}`, `${id}@example.com`, id, `Integrante ${id}`, role]);
  return id;
}

async function restaurant(menuEnabled = true) {
  const id = randomUUID();
  restaurantIds.push(id);
  await query(`INSERT INTO restaurants (id, slug, name, cuisine, neighborhood, menu_enabled)
    VALUES ($1, $2, $3, 'Teste', 'Teste', $4)`, [id, id, `Restaurante ${id}`, menuEnabled]);
  return id;
}

const score = (overrides: Partial<MenuScore> = {}): MenuScore => ({
  flavor: 8,
  value: 7,
  ux: 6,
  waitTime: null,
  rng: null,
  comment: 'Contribuição sintética.',
  ...overrides,
});

async function item(actorId: string, restaurantId: string, name = `Prato ${randomUUID()}`) {
  return createMenuItem(actorId, restaurantId, {
    name,
    category: 'Principal',
    description: 'Descrição sintética.',
    priceCents: null,
  }, score());
}

afterEach(async () => {
  for (const restaurantId of restaurantIds.splice(0)) {
    await query('DELETE FROM menu_photos WHERE item_id IN (SELECT id FROM menu_items WHERE restaurant_id = $1)', [restaurantId]);
    await query('DELETE FROM menu_scorecards WHERE item_id IN (SELECT id FROM menu_items WHERE restaurant_id = $1)', [restaurantId]);
    await query('DELETE FROM menu_items WHERE restaurant_id = $1', [restaurantId]);
    await query('DELETE FROM publication_events WHERE visit_id IN (SELECT id FROM visits WHERE restaurant_id = $1)', [restaurantId]);
    await query('DELETE FROM visit_photos WHERE visit_id IN (SELECT id FROM visits WHERE restaurant_id = $1)', [restaurantId]);
    await query('DELETE FROM scorecards WHERE visit_id IN (SELECT id FROM visits WHERE restaurant_id = $1)', [restaurantId]);
    await query('DELETE FROM visits WHERE restaurant_id = $1', [restaurantId]);
    await query('DELETE FROM restaurants WHERE id = $1', [restaurantId]);
  }
  for (const memberId of memberIds.splice(0).reverse()) {
    await query('DELETE FROM members WHERE id = $1', [memberId]);
  }
});

describe.skipIf(process.env.CRATERISTAS_LOCAL_PG_TESTS !== '1')('repositório de menu no PostgreSQL local descartável', () => {
  it('cria prato e contribuição inicial atomicamente', async () => {
    const actorId = await member();
    const restaurantId = await restaurant();
    const created = await item(actorId, restaurantId, 'Prato atômico');
    const [persisted] = await query(`SELECT item.name,
      (SELECT COUNT(*)::int FROM menu_scorecards scorecard WHERE scorecard.item_id = item.id) AS score_count
      FROM menu_items item WHERE item.id = $1`, [created.id]);
    expect(persisted).toMatchObject({ name: 'Prato atômico', score_count: '1' });

    await expect(createMenuItem(actorId, restaurantId, {
      name: 'Prato que deve reverter',
      category: 'Principal',
      description: '',
      priceCents: null,
    }, score({ comment: '' }))).rejects.toThrow();
    const [rolledBack] = await query('SELECT COUNT(*)::int AS count FROM menu_items WHERE restaurant_id = $1 AND name = $2',
      [restaurantId, 'Prato que deve reverter']);
    expect(rolledBack.count).toBe('0');
  });

  it('preserva ausência opcional como null e nota zero como zero', async () => {
    const first = await member();
    const second = await member();
    const restaurantId = await restaurant();
    const created = await item(first, restaurantId);
    expect(await saveMenuScore(second, restaurantId, created.id, score({ waitTime: 0, rng: 0 }))).toBe(true);

    const found = await findMenuItem(restaurantId, created.slug, true);
    expect(found?.contributions.find((entry) => entry.memberId === first)).toMatchObject({ waitTime: null, rng: null });
    expect(found?.contributions.find((entry) => entry.memberId === second)).toMatchObject({ waitTime: 0, rng: 0 });
  });

  it('nega publicação a integrante comum e impede atravessar o restaurante', async () => {
    const admin = await member('admin');
    const actor = await member();
    const restaurantId = await restaurant();
    const otherRestaurantId = await restaurant();
    const created = await item(actor, restaurantId);

    expect(await changeMenuPublication(actor, restaurantId, created.id, true)).toBe(false);
    expect(await changeMenuPublication(admin, otherRestaurantId, created.id, true)).toBe(false);
    expect(await saveMenuScore(admin, otherRestaurantId, created.id, score())).toBe(false);
    expect(await findMenuItem(otherRestaurantId, created.slug, true)).toBeNull();
    expect(await changeMenuPublication(admin, restaurantId, created.id, true)).toBe(true);
  });

  it('nega novas contribuições de integrante removido', async () => {
    const admin = await member('admin');
    const owner = await member();
    const removed = await member();
    const restaurantId = await restaurant();
    const created = await item(owner, restaurantId);
    await query('UPDATE members SET removed_at = NOW(), removed_by = $2 WHERE id = $1', [removed, admin]);

    await expect(item(removed, restaurantId)).rejects.toThrow('Prato indisponível.');
    expect(await saveMenuScore(removed, restaurantId, created.id, score())).toBe(false);
    expect(await canManageMenuPhotos(removed, created.id)).toBe(false);
  });

  it('reutiliza restaurante sem alterar seus metadados e cria visitas distintas', async () => {
    const repository = createNeonReviewRepository(local.client as ReviewSqlClient);
    const admin = await member('admin');
    const actor = await member();
    const restaurantId = await restaurant(false);
    await query(`UPDATE restaurants SET name = 'Nome preservado', cuisine = 'Cozinha preservada',
      neighborhood = 'Bairro preservado', city = 'Cidade preservada', address = 'Endereço preservado', price_band = '$$$'
      WHERE id = $1`, [restaurantId]);
    const input = {
      restaurantId,
      menuEnabled: true,
      restaurantName: 'Nome que não deve substituir',
      cuisine: 'Outra cozinha',
      neighborhood: 'Outro bairro',
      city: 'Outra cidade',
      visitedAt: '2026-09-09',
    };

    const first = await repository.createVisit(actor, input);
    const second = await repository.createVisit(actor, { ...input, menuEnabled: false, visitedAt: '2026-09-10' });
    expect(first).toMatchObject({ restaurantId, createdBy: actor, visitedAt: '2026-09-09' });
    expect(second).toMatchObject({ restaurantId, createdBy: actor, visitedAt: '2026-09-10' });
    expect(second.id).not.toBe(first.id);
    expect(second.slug).not.toBe(first.slug);
    const [persisted] = await query(`SELECT name, cuisine, neighborhood, city, address, price_band, menu_enabled,
      (SELECT COUNT(*)::int FROM visits WHERE restaurant_id = restaurants.id) AS visit_count
      FROM restaurants WHERE id = $1`, [restaurantId]);
    expect(persisted).toMatchObject({
      name: 'Nome preservado', cuisine: 'Cozinha preservada', neighborhood: 'Bairro preservado',
      city: 'Cidade preservada', address: 'Endereço preservado', price_band: '$$$', menu_enabled: true,
      visit_count: '2',
    });
    const managed = await repository.listVisitsForManagement(actor);
    expect(managed.filter((visit) => visit.id === first.id || visit.id === second.id)).toHaveLength(2);
    await query('UPDATE members SET removed_at = NOW(), removed_by = $2 WHERE id = $1', [actor, admin]);
    expect(await repository.listVisitsForManagement(actor)).toEqual([]);
  });

  it('serializa cinco vagas de foto entre dono e admin e rejeita outras tentativas', async () => {
    const admin = await member('admin');
    const owner = await member();
    const outsider = await member();
    const restaurantId = await restaurant();
    const created = await item(owner, restaurantId);

    expect(await canManageMenuPhotos(owner, created.id)).toBe(true);
    expect(await canManageMenuPhotos(admin, created.id)).toBe(true);
    expect(await canManageMenuPhotos(outsider, created.id)).toBe(false);
    expect(await attachMenuPhoto(outsider, created.id, 'https://example.invalid/denied.webp', `qa/${randomUUID()}.webp`)).toBe(false);

    const uploads = Array.from({ length: 5 }, (_, index) => attachMenuPhoto(
      index % 2 === 0 ? owner : admin,
      created.id,
      `https://example.invalid/${index}.webp`,
      `qa/${randomUUID()}.webp`,
    ));
    expect(await Promise.all(uploads)).toEqual([true, true, true, true, true]);
    expect(await attachMenuPhoto(owner, created.id, 'https://example.invalid/sixth.webp', `qa/${randomUUID()}.webp`)).toBe(false);
    const positions = await query('SELECT position FROM menu_photos WHERE item_id = $1 ORDER BY position', [created.id]);
    expect(positions.map((row) => Number(row.position))).toEqual([1, 2, 3, 4, 5]);
  }, 20000);
});
