import Link from 'next/link';
import { MotionScope } from '@/components/motion/MotionScope';
import type {
  PublicComment,
  PublicPhoto,
  PublicRestaurantSummary,
} from '@/domain/reviews/repository';
import type { DisplayScoreValues } from './restaurant-formatters';
import type { RestaurantVisitOption } from '@/features/restaurants/catalog-types';
import { VisitDateSelector } from './VisitDateSelector';
import navigationStyles from './visit-navigation.module.css';
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
  visits?: RestaurantVisitOption[];
  selectedVisitId?: string;
  menuEnabled?: boolean;
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
  visits = [],
  selectedVisitId,
  menuEnabled = false,
}: RestaurantReviewProps) {
  return (
    <RestaurantAtmosphere enabled={photos.length > 0}>
      <MotionScope>
        <article className={styles.reviewPage}>
          <Link className={styles.backLink} href="/registros">
            ← Voltar ao livro de registros
          </Link>

          <header className={styles.reviewHeader}>
            <h1 data-motion="inscription">{restaurant.name}</h1>
            <div className={styles.restaurantMeta}>
              <span>{restaurant.cuisine}</span>
              <span aria-hidden="true">•</span>
              <span>{restaurant.neighborhood}, {restaurant.city}</span>
            </div>
            {restaurant.address ? <p className={styles.address}>{restaurant.address}</p> : null}
          </header>

          <div className={navigationStyles.visitToolbar}>
            <VisitDateSelector visitedAt={visitedAt} restaurantSlug={restaurant.slug} visits={visits} selectedVisitId={selectedVisitId} />
            {menuEnabled ? <Link className={navigationStyles.menuLink} href={`/restaurantes/${restaurant.slug}/menu`}>Menu</Link> : null}
          </div>
          <PhotoGallery photos={photos} restaurantName={restaurant.name} />

          <section aria-labelledby="evidencias-titulo" className={styles.evidenceSection}>
            <header className={styles.evidenceHeader}>
              <h2 id="evidencias-titulo">Avaliação coletiva</h2>
              <p>Uma mesa, diferentes impressões. Explore o que cada craterista pediu, comentou e avaliou.</p>
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
          <nav className={navigationStyles.actions} aria-label="Continuar neste restaurante">
            <Link href={`/visitas/nova?restaurante=${restaurant.slug}`}>Adicionar nova visita ao restaurante</Link>
          </nav>
        </article>
      </MotionScope>
    </RestaurantAtmosphere>
  );
}
