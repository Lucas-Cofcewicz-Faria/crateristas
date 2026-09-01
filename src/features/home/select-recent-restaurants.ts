import type { PublicVisitSummary } from '@/domain/reviews/repository';

export const HOME_RECENT_RESTAURANT_LIMIT = 6;

export function selectRecentRestaurants(
  records: readonly PublicVisitSummary[],
  limit = HOME_RECENT_RESTAURANT_LIMIT,
): PublicVisitSummary[] {
  const selected: PublicVisitSummary[] = [];
  const seenRestaurants = new Set<string>();

  for (const record of records) {
    if (seenRestaurants.has(record.restaurant.slug)) continue;
    seenRestaurants.add(record.restaurant.slug);
    selected.push(record);
    if (selected.length === limit) break;
  }

  return selected;
}
