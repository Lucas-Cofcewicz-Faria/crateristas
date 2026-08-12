import { createReviewService, type ReviewService } from '@/domain/reviews/service';
import { createNeonReviewRepository } from '@/lib/repositories/neon-review-repository';

export function getReviewService(): ReviewService {
  return createReviewService(createNeonReviewRepository());
}
