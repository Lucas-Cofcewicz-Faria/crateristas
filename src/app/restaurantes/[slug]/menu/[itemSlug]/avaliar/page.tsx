import { requireMember } from '@/lib/auth/access';
import { PublicShell } from '@/components/shell/PublicShell';
import { MenuFrame } from '@/features/menu/MenuFrame';
import { MenuReviewForm } from '@/features/menu/MenuReviewForm';
import styles from '@/features/menu/menu.module.css';
import { getMenuItemContext } from '../../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Avaliar prato | Crateristas', robots: { index: false } };
export default async function ReviewMenuItemPage({ params }: { params: Promise<{ slug: string; itemSlug: string }> }) {
  const actor = await requireMember();
  const { slug, itemSlug } = await params;
  const { restaurant, coverUrl, item } = await getMenuItemContext(slug, itemSlug);
  return <PublicShell viewer="member"><MenuFrame restaurant={restaurant} coverUrl={coverUrl}>
    <header className={styles.heading}><div><h1>Sua avaliação de {item.name}</h1><p>As notas e o comentário se juntam às contribuições dos outros crateristas.</p></div></header>
    <MenuReviewForm restaurantSlug={restaurant.slug} item={item} initialScore={item.contributions.find((score) => score.memberId === actor.id)} canManagePhotos={actor.role === 'admin' || actor.id === item.createdBy} />
  </MenuFrame></PublicShell>;
}
