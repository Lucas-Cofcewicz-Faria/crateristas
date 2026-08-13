import { cache } from 'react';
import type { PublicVisitDetail } from '@/domain/reviews/repository';
import { getReviewRepository } from '@/lib/reviews/server';

export const getPublicVisitDetail = cache(async (slug: string): Promise<PublicVisitDetail | null> => (
  getReviewRepository().getPublicVisitBySlug(slug)
));
