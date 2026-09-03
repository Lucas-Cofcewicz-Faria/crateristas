import Link from 'next/link';
import type {
  PublicComment,
  PublicPhoto,
  PublicRestaurantSummary,
} from '@/domain/reviews/repository';
import type { DisplayScoreValues } from './restaurant-formatters';
import { formatVisitDate } from './restaurant-formatters';
import { CommentFragments } from './CommentFragments';
import { PhotoGallery } from './PhotoGallery';
import { ScoreBreakdown } from './ScoreBreakdown';
import { RestaurantAtmosphere } from './RestaurantAtmosphere';
import styles from './restaurant.module.css';

export interface RestaurantReviewProps {
  restaurant: PublicRestaurantSummary;
  visitedAt: string;
  participantCount: number;
  scores: DisplayScoreValues | null;
  overall: number | null;
  historical: boolean;
  photos: PublicPhoto[];
  comments: PublicComment[];
}

export function RestaurantReview({
  restaurant,
  visitedAt,
  participantCount,
  scores,
  overall,
  historical,
  photos,
  comments,
}: RestaurantReviewProps) {
  return (
    <RestaurantAtmosphere enabled={photos.length > 0}>
      <article className={styles.reviewPage}>
      <Link className={styles.backLink} href="/registros">
        ← Voltar ao livro de registros
      </Link>

      <header className={styles.reviewHeader}>
        <p className={styles.eyebrow}>Evidências de uma visita publicada</p>
        <h1>{restaurant.name}</h1>
        <div className={styles.restaurantMeta}>
          <span>{restaurant.cuisine}</span>
          <span aria-hidden="true">•</span>
          <span>{restaurant.neighborhood}, {restaurant.city}</span>
        </div>
        <p className={styles.visitDate}>
          Visita em <time dateTime={visitedAt}>{formatVisitDate(visitedAt)}</time>
        </p>
        {restaurant.address ? <p className={styles.address}>{restaurant.address}</p> : null}
      </header>

      <PhotoGallery photos={photos} restaurantName={restaurant.name} />

      <section aria-labelledby="evidencias-titulo" className={styles.evidenceSection}>
        <header className={styles.evidenceHeader}>
          <p className={styles.eyebrow}>Caderno coletivo</p>
          <h2 id="evidencias-titulo">Vozes e medidas da mesa</h2>
          <p>As impressões publicadas permanecem junto das médias coletivas da visita.</p>
        </header>
        <div className={styles.evidenceComposition}>
          <div className={styles.scorePanel}>
            <ScoreBreakdown
              historical={historical}
              overall={overall}
              participantCount={participantCount}
              scores={scores}
            />
          </div>
          <CommentFragments comments={comments} />
        </div>
      </section>
      </article>
    </RestaurantAtmosphere>
  );
}
