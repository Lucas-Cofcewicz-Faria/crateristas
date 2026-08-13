import { createReviewService, type ReviewService } from '@/domain/reviews/service';
import type { ReviewRepository } from '@/domain/reviews/repository';
import { createNeonReviewRepository } from '@/lib/repositories/neon-review-repository';

export function getReviewRepository(): ReviewRepository {
  return createNeonReviewRepository();
}

export function getReviewService(): ReviewService {
  return createReviewService(getReviewRepository());
}
