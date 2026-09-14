import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/app/globals.css';
import './fonts.css';
import { PublicShell } from '@/components/shell/PublicShell';
import { RestaurantReview } from '@/features/restaurant/RestaurantReview';
import { MembersPreview } from '@/features/home/MembersPreview';
import { RecentRestaurantsCarousel } from '@/features/home/RecentRestaurantsCarousel';

// Local visual fixture only. Does not query or mutate production data.
const restaurant = { slug: 'teste', name: 'Restaurante de teste', cuisine: 'Brasileira', neighborhood: 'Butantã', city: 'São Paulo', address: null, priceBand: '$$' };
const photos = [
  { id: '1', position: 0, url: '/images/history/cratera1.jpeg' },
  { id: '2', position: 1, url: '/images/history/cratera2.jpg' },
];
const visits = [{ id: '1', visitedAt: '2026-09-13' }, { id: '2', visitedAt: '2026-08-13' }];
const records = ['Cantina de teste', 'Segunda cantina', 'Terceira cantina'].map((name, index) => ({
  id: String(index), slug: `teste-${index}`, restaurant: { ...restaurant, name, slug: `teste-${index}` },
  visitedAt: '2026-09-13', publishedAt: '2026-09-13', participantCount: 3, averages: null, overall: 7 + index,
  coverPhotoUrl: photos[index % photos.length].url,
}));
const members = ['Ana de Teste', 'Bruno de Teste'].map((displayName, index) => ({
  slug: `teste-${index}`, displayName, memberNumber: index + 1, avatarUrl: null,
  societyTitle: index === 0 ? 'Guardiã das Mesas Longas' : null, bio: '', favoriteCuisine: null,
  contributions: { publishedVisits: 2, scorecards: 2 },
}));
const view = new URLSearchParams(location.search).get('view');
createRoot(document.getElementById('root')!).render(<React.StrictMode><PublicShell viewer="member">
  {view === 'restaurant' ? <RestaurantReview restaurant={restaurant} visitedAt="2026-09-13" participantCount={0}
    scores={null} overall={null} historical={false} photos={photos} comments={[]} visits={visits} selectedVisitId="1" menuEnabled />
    : <><section style={{ paddingBlock: '56px', maxWidth: '1440px', margin: 'auto' }}><RecentRestaurantsCarousel records={records} /></section><MembersPreview members={members} /></>}
</PublicShell></React.StrictMode>);
