import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { findOptionalMember } from '@/lib/auth/access';
import { findCatalogRestaurant, getRestaurantCover } from '@/features/restaurants/catalog';
import { findMenuItem } from '@/features/menu/menu-repository';

export const getMenuContext = cache(async (slug: string) => {
  const member = await findOptionalMember();
  const restaurant = await findCatalogRestaurant(slug, Boolean(member));
  if (!restaurant?.menuEnabled) notFound();
  const coverUrl = await getRestaurantCover(restaurant.id);
  return { restaurant, member, coverUrl };
});

export const getMenuItemContext = cache(async (slug: string, itemSlug: string) => {
  const context = await getMenuContext(slug);
  const item = await findMenuItem(context.restaurant.id, itemSlug, Boolean(context.member));
  if (!item) notFound();
  return { ...context, item };
});
