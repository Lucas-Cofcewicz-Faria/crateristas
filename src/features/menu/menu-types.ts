import type { PublicPhoto } from '@/domain/reviews/repository';

export interface MenuScore {
  flavor: number;
  value: number;
  ux: number;
  waitTime: number | null;
  rng: number | null;
  comment: string;
}
export interface MenuContribution extends MenuScore {
  memberId: string;
  displayName: string;
  avatarUrl: string | null;
}
export interface MenuItem {
  id: string;
  slug: string;
  restaurantId: string;
  name: string;
  category: string;
  description: string;
  priceCents: number | null;
  createdBy: string;
  publicationState: 'private' | 'published' | 'hidden';
  photos: PublicPhoto[];
  contributions: MenuContribution[];
}
