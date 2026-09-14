import { cache } from 'react';
import type { PublicVisitDetail } from '@/domain/reviews/repository';
import { getReviewRepository } from '@/lib/reviews/server';
import { findCatalogRestaurant, listRestaurantVisits } from '@/features/restaurants/catalog';

export const getRestaurantVisitPage = cache(async (slug: string, visitId?: string, memberId?: string) => {
  const restaurant = await findCatalogRestaurant(slug, memberId);
  if (!restaurant) return null;
  const visits = await listRestaurantVisits(restaurant.id, memberId);
  const selected = visitId ? visits.find((visit) => visit.id === visitId) : visits[0];
  if (!selected) return null;
  const repository = getReviewRepository();
  const visit = memberId
    ? await repository.getMemberVisibleVisitBySlug(selected.slug, memberId)
    : await repository.getPublicVisitBySlug(selected.slug);
  return visit ? { visit, restaurant, visits } : null;
});

export const getPublicVisitDetail = cache(async (slug: string, visitId?: string): Promise<PublicVisitDetail | null> => (
  (await getRestaurantVisitPage(slug, visitId))?.visit ?? null
));
