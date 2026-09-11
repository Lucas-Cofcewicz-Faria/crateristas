import type { Metadata } from 'next';
import { PublicShell } from '@/components/shell/PublicShell';
import { MenuFrame } from '@/features/menu/MenuFrame';
import { MenuItemReview } from '@/features/menu/MenuItemReview';
import { MenuPublicationControls } from '@/features/menu/MenuPublicationControls';
import styles from '@/features/menu/menu.module.css';
import { getMenuItemContext } from '../data';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string; itemSlug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, itemSlug } = await params;
  const { restaurant, item } = await getMenuItemContext(slug, itemSlug);
  return { title: `${item.name} · ${restaurant.name} | Crateristas`, robots: { index: item.publicationState === 'published' } };
}
export default async function MenuItemPage({ params }: Props) {
  const { slug, itemSlug } = await params;
  const { restaurant, coverUrl, member, item } = await getMenuItemContext(slug, itemSlug);
  return <PublicShell viewer={member ? 'member' : 'visitor'}><MenuFrame restaurant={restaurant} coverUrl={coverUrl}>
    <MenuItemReview item={item} restaurantSlug={restaurant.slug} canContribute={Boolean(member)} />
    {member?.role === 'admin' && <section className={styles.management} aria-labelledby="gerenciar-prato">
      <h2 id="gerenciar-prato">Gerenciar este prato</h2>
      <p>A publicação para visitantes é controlada pelo administrador.</p>
      <MenuPublicationControls restaurantSlug={restaurant.slug} itemSlug={item.slug} published={item.publicationState === 'published'} />
    </section>}
  </MenuFrame></PublicShell>;
}
