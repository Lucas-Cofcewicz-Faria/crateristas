import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/app/globals.css';
import './fonts.css';
import { MenuFrame } from '@/features/menu/MenuFrame';
import { MenuCatalog } from '@/features/menu/MenuCatalog';
import { MenuItemReview } from '@/features/menu/MenuItemReview';
import { MenuReviewForm } from '@/features/menu/MenuReviewForm';
import { VisitDateSelector } from '@/features/restaurant/VisitDateSelector';
import { RecentRestaurantsCarousel } from '@/features/home/RecentRestaurantsCarousel';
import styles from '@/features/menu/menu.module.css';
const restaurant = { id: 'r', slug: 'qa', name: 'Restaurante de teste', cuisine: 'Brasileira', neighborhood: 'Butantã', city: 'São Paulo', address: null, priceBand: null, menuEnabled: true };
const contributions = [
  { memberId: '1', displayName: 'Integrante de teste', avatarUrl: null, flavor: 9, value: 8, ux: 9, waitTime: 7, rng: 10, comment: 'Exemplo sintético para verificar a leitura do comentário e das notas individuais.' },
  { memberId: '2', displayName: 'Outro integrante de teste', avatarUrl: null, flavor: 7, value: 6, ux: 8, waitTime: null, rng: null, comment: 'A fotografia e os dados desta tela são apenas uma simulação local de layout.' },
];
const item = { id: 'dish', slug: 'prato-qa', restaurantId: 'r', name: 'Macarrão ao molho de tomate', category: 'Massas', description: 'Dados sintéticos de avaliação. Nenhum registro é salvo em produção.', priceCents: 2450, createdBy: '1', publicationState: 'published', photos: [{ id: 'p', url: '/images/history/cratera2.jpg', position: 1 }], contributions };
const view = new URLSearchParams(location.search).get('view');
const carouselRecords = ['Cantina de teste', 'Cozinha do segundo registro', 'Restaurante de teste com nome maior'].map((name, index) => ({
  id: `test-${index}`, slug: `test-${index}`, restaurant: { ...restaurant, name, slug: `test-${index}` },
  visitedAt: '2026-09-09', publishedAt: '2026-09-10', participantCount: 3, averages: null, overall: 7 + index,
  coverPhotoUrl: index === 2 ? null : index === 0 ? '/images/history/cratera1.jpeg' : '/images/history/cratera2.jpg',
}));
createRoot(document.getElementById('root')!).render(<MenuFrame restaurant={restaurant} coverUrl="/images/history/cratera1.jpeg">
  {view === 'carousel' ? <RecentRestaurantsCarousel records={carouselRecords} />
    : view === 'detail' ? <MenuItemReview item={item} restaurantSlug="qa" canContribute />
    : view === 'form' ? <><header className={styles.heading}><h1>Adicionar prato</h1></header><MenuReviewForm restaurantSlug="qa" /></>
    : <><header className={styles.heading}><div><h1>À mesa, prato a prato.</h1><p>Exemplo local de catálogo, sem dados reais.</p></div><a className={styles.action} href="?view=form">Adicionar prato</a></header>
      <VisitDateSelector restaurantSlug="qa" visitedAt="2026-09-09" selectedVisitId="new" visits={[{ id: 'new', slug: 'new', visitedAt: '2026-09-09' }, { id: 'old', slug: 'old', visitedAt: '2026-08-01' }]} />
      <MenuCatalog restaurantSlug="qa" items={[item, { ...item, id: '2', slug: 'segundo', name: 'Frango crocante', category: 'Aves', priceCents: null, photos: [], publicationState: 'private' }]} /></>}
</MenuFrame>);
