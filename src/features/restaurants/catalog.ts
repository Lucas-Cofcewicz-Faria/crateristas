import 'server-only';
import { getDb } from '@/lib/db';
import type { CatalogRestaurant, RestaurantVisitOption } from './catalog-types';

function restaurant(row: Record<string, unknown>): CatalogRestaurant {
  return {
    id: String(row.id), slug: String(row.slug), name: String(row.name), cuisine: String(row.cuisine),
    neighborhood: String(row.neighborhood), city: String(row.city),
    address: row.address ? String(row.address) : null, priceBand: row.price_band ? String(row.price_band) : null,
    menuEnabled: row.menu_enabled === true,
  };
}

export async function findCatalogRestaurant(slug: string, memberId?: string): Promise<CatalogRestaurant | null> {
  const rows = await getDb().query(`SELECT r.* FROM restaurants r
    WHERE (r.slug = $1 OR r.id = (SELECT v.restaurant_id FROM visits v WHERE v.slug = $1))
      AND (
        EXISTS (SELECT 1 FROM visits v WHERE v.restaurant_id = r.id AND v.publication_state = 'published')
        OR EXISTS (SELECT 1 FROM members viewer WHERE viewer.id = $2 AND viewer.removed_at IS NULL)
      )
    ORDER BY (r.slug = $1) DESC LIMIT 1`, [slug, memberId ?? null]);
  return rows[0] ? restaurant(rows[0]) : null;
}

export async function listCatalogRestaurants(): Promise<CatalogRestaurant[]> {
  return (await getDb().query('SELECT * FROM restaurants ORDER BY name, id')).map(restaurant);
}

export async function getRestaurantForVisit(visitId: string): Promise<CatalogRestaurant | null> {
  const rows = await getDb().query('SELECT r.* FROM restaurants r JOIN visits v ON v.restaurant_id = r.id WHERE v.id = $1', [visitId]);
  return rows[0] ? restaurant(rows[0]) : null;
}

export async function listRestaurantVisits(restaurantId: string, memberId?: string): Promise<RestaurantVisitOption[]> {
  const rows = await getDb().query(`SELECT id, slug, visited_at::text FROM visits
    WHERE restaurant_id = $1
      AND (
        publication_state = 'published'
        OR (
          EXISTS (SELECT 1 FROM members viewer WHERE viewer.id = $2 AND viewer.removed_at IS NULL)
          AND EXISTS (SELECT 1 FROM scorecards visible_score WHERE visible_score.visit_id = visits.id)
        )
      )
    ORDER BY visited_at DESC, created_at DESC, id DESC`, [restaurantId, memberId ?? null]);
  return rows.map((row) => ({ id: String(row.id), slug: String(row.slug), visitedAt: String(row.visited_at) }));
}

export async function getRestaurantCover(restaurantId: string): Promise<string | null> {
  const rows = await getDb().query(`SELECT p.url FROM visit_photos p JOIN visits v ON v.id = p.visit_id
    WHERE v.restaurant_id = $1 AND v.publication_state = 'published'
    ORDER BY v.visited_at DESC, v.created_at DESC, p.position LIMIT 1`, [restaurantId]);
  return rows[0] ? String(rows[0].url) : null;
}
