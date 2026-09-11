import Link from 'next/link';
import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { PublicShell } from '@/components/shell/PublicShell';
import { MenuFrame } from '@/features/menu/MenuFrame';
import { MenuCatalog } from '@/features/menu/MenuCatalog';
import { listMenuItems } from '@/features/menu/menu-repository';
import styles from '@/features/menu/menu.module.css';
import { getMenuContext } from './data';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { restaurant } = await getMenuContext((await params).slug);
  return { title: `Menu de ${restaurant.name} | Crateristas` };
}
export default async function RestaurantMenuPage({ params }: Props) {
  const { restaurant, member, coverUrl } = await getMenuContext((await params).slug);
  const items = await listMenuItems(restaurant.id, Boolean(member));
  return <PublicShell viewer={member ? 'member' : 'visitor'}>
    <MenuFrame restaurant={restaurant} coverUrl={coverUrl}>
      <header className={styles.heading}>
        <div><h1>À mesa, prato a prato.</h1><p>O menu de {restaurant.name}, experimentado e avaliado pelos crateristas.</p></div>
        {member && <Link className={styles.action} href={`/restaurantes/${restaurant.slug}/menu/novo`}><Plus size={18} aria-hidden="true" />Adicionar prato</Link>}
      </header>
      <MenuCatalog restaurantSlug={restaurant.slug} items={items} />
    </MenuFrame>
  </PublicShell>;
}
