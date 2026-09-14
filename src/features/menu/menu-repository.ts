import 'server-only';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/db';
import type { MenuItem, MenuScore } from './menu-types';
import type { z } from 'zod';
import type { menuItemSchema } from './menu-scores';

const itemSelect = `SELECT item.*,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('id', p.id, 'url', p.url, 'position', p.position) ORDER BY p.position)
    FROM menu_photos p WHERE p.item_id = item.id), '[]'::jsonb) AS photos,
  COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'memberId', m.id, 'displayName', m.display_name, 'avatarUrl', m.avatar_url,
    'flavor', s.flavor, 'value', s.value, 'ux', s.ux, 'waitTime', s.wait_time, 'rng', s.rng, 'comment', s.comment
  ) ORDER BY m.member_number) FROM menu_scorecards s JOIN members m ON m.id = s.member_id
    WHERE s.item_id = item.id), '[]'::jsonb) AS comments
  FROM menu_items item JOIN restaurants r ON r.id = item.restaurant_id`;

function itemFromRow(row: Record<string, unknown>): MenuItem {
  return {
    id: String(row.id), restaurantId: String(row.restaurant_id), slug: String(row.slug), name: String(row.name),
    category: String(row.category), description: String(row.description), priceCents: row.price_cents == null ? null : Number(row.price_cents),
    createdBy: String(row.created_by), publicationState: row.publication_state as MenuItem['publicationState'],
    photos: row.photos as MenuItem['photos'], contributions: row.comments as MenuItem['contributions'],
  };
}

export async function listMenuItems(restaurantId: string, includeDrafts = false): Promise<MenuItem[]> {
  const rows = await getDb().query(`${itemSelect}
    WHERE item.restaurant_id = $1 AND r.menu_enabled AND ($2 OR item.publication_state = 'published')
    ORDER BY item.created_at DESC, item.id`, [restaurantId, includeDrafts]);
  return rows.map(itemFromRow);
}

export async function findMenuItem(restaurantId: string, slug: string, includeDrafts = false): Promise<MenuItem | null> {
  const rows = await getDb().query(`${itemSelect}
    WHERE item.restaurant_id = $1 AND item.slug = $2 AND r.menu_enabled
      AND ($3 OR item.publication_state = 'published')`, [restaurantId, slug, includeDrafts]);
  return rows[0] ? itemFromRow(rows[0]) : null;
}

export async function createMenuItem(actorId: string, restaurantId: string, input: z.infer<typeof menuItemSchema>, score: MenuScore) {
  const slug = `${input.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'prato'}-${randomUUID().slice(0, 8)}`;
  const rows = await getDb().query(`WITH created AS (
    INSERT INTO menu_items (restaurant_id, slug, name, category, description, price_cents, created_by)
    SELECT r.id, $3, $4, $5, $6, $7, m.id FROM restaurants r JOIN members m ON m.id = $1 AND m.removed_at IS NULL
    WHERE r.id = $2 AND r.menu_enabled RETURNING id, slug
  ), contribution AS (
    INSERT INTO menu_scorecards (item_id, member_id, flavor, value, ux, wait_time, rng, comment)
    SELECT id, $1, $8, $9, $10, $11, $12, $13 FROM created RETURNING item_id
  ) SELECT created.id, created.slug FROM created JOIN contribution ON contribution.item_id = created.id`,
  [actorId, restaurantId, slug, input.name, input.category, input.description, input.priceCents,
    score.flavor, score.value, score.ux, score.waitTime, score.rng, score.comment]);
  if (!rows[0]) throw new Error('Prato indisponível.');
  return { id: String(rows[0].id), slug: String(rows[0].slug) };
}

export async function saveMenuScore(actorId: string, restaurantId: string, itemId: string, score: MenuScore): Promise<boolean> {
  const rows = await getDb().query(`INSERT INTO menu_scorecards (item_id, member_id, flavor, value, ux, wait_time, rng, comment)
    SELECT item.id, m.id, $4, $5, $6, $7, $8, $9 FROM menu_items item
    JOIN restaurants r ON r.id = item.restaurant_id AND r.menu_enabled
    JOIN members m ON m.id = $1 AND m.removed_at IS NULL
    WHERE item.id = $3 AND r.id = $2
    ON CONFLICT (item_id, member_id) DO UPDATE SET flavor = EXCLUDED.flavor, value = EXCLUDED.value,
      ux = EXCLUDED.ux, wait_time = EXCLUDED.wait_time, rng = EXCLUDED.rng, comment = EXCLUDED.comment, updated_at = NOW()
    RETURNING item_id`, [actorId, restaurantId, itemId, score.flavor, score.value, score.ux, score.waitTime, score.rng, score.comment]);
  return rows.length > 0;
}

export async function changeMenuPublication(actorId: string, restaurantId: string, itemId: string, publish: boolean): Promise<boolean> {
  const rows = await getDb().query(`UPDATE menu_items item
    SET publication_state = CASE WHEN $4 THEN 'published' ELSE 'hidden' END,
      published_at = CASE WHEN $4 THEN NOW() ELSE published_at END,
      published_by = CASE WHEN $4 THEN $1 ELSE published_by END, updated_at = NOW()
    WHERE item.id = $3 AND item.restaurant_id = $2
      AND EXISTS (SELECT 1 FROM members WHERE id = $1 AND role = 'admin' AND removed_at IS NULL)
      AND EXISTS (SELECT 1 FROM menu_scorecards WHERE item_id = item.id)
    RETURNING item.id`, [actorId, restaurantId, itemId, publish]);
  return rows.length > 0;
}

export async function canManageMenuPhotos(actorId: string, itemId: string): Promise<boolean> {
  const rows = await getDb().query(`SELECT item.id FROM menu_items item JOIN restaurants r ON r.id = item.restaurant_id
    JOIN members m ON m.id = $1 AND m.removed_at IS NULL
    WHERE item.id = $2 AND r.menu_enabled AND (item.created_by = m.id OR m.role = 'admin')`, [actorId, itemId]);
  return rows.length > 0;
}

export async function attachMenuPhoto(actorId: string, itemId: string, url: string, pathname: string): Promise<boolean> {
  const [, rows] = await getDb().transaction((tx) => [
    tx.query('SELECT id FROM menu_items WHERE id = $1 FOR UPDATE', [itemId]),
    tx.query(`INSERT INTO menu_photos (item_id, uploaded_by, url, pathname, position)
      SELECT item.id, m.id, $3, $4, slot.position FROM menu_items item
      JOIN restaurants r ON r.id = item.restaurant_id AND r.menu_enabled
      JOIN members m ON m.id = $1 AND m.removed_at IS NULL
      CROSS JOIN LATERAL (SELECT slots.position FROM generate_series(1, 5) slots(position)
        WHERE NOT EXISTS (SELECT 1 FROM menu_photos p WHERE p.item_id = item.id AND p.position = slots.position)
        ORDER BY slots.position LIMIT 1) slot
      WHERE item.id = $2 AND (item.created_by = m.id OR m.role = 'admin') RETURNING id`, [actorId, itemId, url, pathname]),
  ]);
  return rows.length > 0;
}
