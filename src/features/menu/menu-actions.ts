'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, requireMember } from '@/lib/auth/access';
import { findCatalogRestaurant } from '@/features/restaurants/catalog';
import { menuItemSchema, menuScoreSchema } from './menu-scores';
import { changeMenuPublication, createMenuItem, findMenuItem, saveMenuScore } from './menu-repository';

export async function saveMenuReviewAction(data: FormData): Promise<{ error: string | null; href?: string; itemId?: string }> {
  try {
    const actor = await requireMember();
    const restaurant = await findCatalogRestaurant(String(data.get('restaurantSlug') ?? ''), true);
    if (!restaurant?.menuEnabled) return { error: 'O menu deste restaurante não está disponível.' };
    const optionalNumber = (key: string) => data.get(key) === null || data.get(key) === '' ? null : Number(data.get(key));
    const score = menuScoreSchema.parse({
      flavor: optionalNumber('flavor'), value: optionalNumber('value'), ux: optionalNumber('ux'),
      waitTime: optionalNumber('waitTime'), rng: optionalNumber('rng'), comment: data.get('comment'),
    });
    const existingSlug = data.get('itemSlug');
    let slug: string;
    let itemId: string;
    if (typeof existingSlug === 'string' && existingSlug) {
      const item = await findMenuItem(restaurant.id, existingSlug, true);
      if (!item || !await saveMenuScore(actor.id, restaurant.id, item.id, score)) return { error: 'Prato indisponível. Atualize a página.' };
      slug = item.slug;
      itemId = item.id;
    } else {
      const input = menuItemSchema.parse({ name: data.get('name'), category: 'Sem categoria',
        description: data.get('description') ?? '', priceCents: optionalNumber('priceCents') });
      const created = await createMenuItem(actor.id, restaurant.id, input, score);
      slug = created.slug;
      itemId = created.id;
    }
    const href = `/restaurantes/${restaurant.slug}/menu/${slug}`;
    revalidatePath(`/restaurantes/${restaurant.slug}/menu`);
    revalidatePath(href);
    return { error: null, href, itemId };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: 'Revise o nome, o preço, o comentário e as notas. RNG aceita de 0 a 100%.' };
    return { error: 'Não foi possível salvar. Confira seu acesso e tente novamente.' };
  }
}

export async function publishMenuItemAction(data: FormData): Promise<{ error: string | null }> {
  try {
    const actor = await requireAdmin();
    const restaurantSlug = z.string().min(1).parse(data.get('restaurantSlug'));
    const itemSlug = z.string().min(1).parse(data.get('itemSlug'));
    const command = z.enum(['publish', 'hide']).parse(data.get('command'));
    const restaurant = await findCatalogRestaurant(restaurantSlug, true);
    const item = restaurant?.menuEnabled ? await findMenuItem(restaurant.id, itemSlug, true) : null;
    if (!restaurant || !item || !await changeMenuPublication(actor.id, restaurant.id, item.id, command === 'publish')) {
      return { error: 'Não foi possível alterar a publicação. Atualize a página e tente novamente.' };
    }
    revalidatePath(`/restaurantes/${restaurant.slug}/menu`);
    revalidatePath(`/restaurantes/${restaurant.slug}/menu/${item.slug}`);
    return { error: null };
  } catch {
    return { error: 'Não foi possível alterar a publicação. Confira seu acesso de administrador e tente novamente.' };
  }
}
