import { cache } from 'react';
import type { PublicVisitDetail } from '@/domain/reviews/repository';
import { getReviewRepository } from '@/lib/reviews/server';
import { findCatalogRestaurant, listRestaurantVisits } from '@/features/restaurants/catalog';

export const getRestaurantVisitPage = cache(async (slug: string, visitId?: string) => {
  const restaurant = await findCatalogRestaurant(slug);
  if (!restaurant) return null;
  const visits = await listRestaurantVisits(restaurant.id);
  const selected = visitId ? visits.find((visit) => visit.id === visitId) : visits[0];
  if (!selected) return null;
  const visit = await getReviewRepository().getPublicVisitBySlug(selected.slug);
  return visit ? { visit, restaurant, visits } : null;
});

export const getPublicVisitDetail = cache(async (slug: string, visitId?: string): Promise<PublicVisitDetail | null> => (
  (await getRestaurantVisitPage(slug, visitId))?.visit ?? null
));
