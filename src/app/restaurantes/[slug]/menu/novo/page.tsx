import { requireMember } from '@/lib/auth/access';
import { PublicShell } from '@/components/shell/PublicShell';
import { MenuFrame } from '@/features/menu/MenuFrame';
import { MenuReviewForm } from '@/features/menu/MenuReviewForm';
import styles from '@/features/menu/menu.module.css';
import { getMenuContext } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Adicionar prato | Crateristas', robots: { index: false } };
export default async function NewMenuItemPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireMember();
  const { restaurant, coverUrl } = await getMenuContext((await params).slug);
  return <PublicShell viewer="member"><MenuFrame restaurant={restaurant} coverUrl={coverUrl}>
    <header className={styles.heading}><div><h1>Adicionar prato</h1><p>Registre o que chegou à mesa em {restaurant.name}. Salve o prato e a avaliação; depois inclua as fotos nesta mesma tela.</p></div></header>
    <MenuReviewForm restaurantSlug={restaurant.slug} />
  </MenuFrame></PublicShell>;
}
