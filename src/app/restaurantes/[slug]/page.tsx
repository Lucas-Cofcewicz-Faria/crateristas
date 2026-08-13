import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/shell/PublicShell';
import type { PublicVisitDetail } from '@/domain/reviews/repository';
import { RestaurantReview } from '@/features/restaurant/RestaurantReview';
import {
  formatScore,
  formatVisitDate,
  getVisitScoreSnapshot,
} from '@/features/restaurant/restaurant-formatters';
import { findOptionalMember } from '@/lib/auth/access';
import { getPublicVisitDetail } from './data';

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

function metadataForVisit(visit: PublicVisitDetail): Metadata {
  const { overall } = getVisitScoreSnapshot(visit);
  const scoreDescription = overall === null
    ? 'Nota coletiva não disponível'
    : `Nota coletiva ${formatScore(overall)} de 10`;
  const participantDescription = visit.participantCount === 1
    ? '1 craterista participante'
    : `${visit.participantCount} crateristas participantes`;

  return {
    title: `${visit.restaurant.name} — registro coletivo`,
    description: `Visita ao restaurante ${visit.restaurant.name} em ${formatVisitDate(visit.visitedAt)}. ${scoreDescription}, com ${participantDescription}.`,
  };
}

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const visit = await getPublicVisitDetail(slug);
  if (!visit) notFound();
  return metadataForVisit(visit);
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { slug } = await params;
  const [visit, member] = await Promise.all([
    getPublicVisitDetail(slug),
    findOptionalMember(),
  ]);
  if (!visit) notFound();

  const scoreSnapshot = getVisitScoreSnapshot(visit);

  return (
    <PublicShell viewer={member ? 'member' : 'visitor'}>
      <RestaurantReview
        comments={visit.comments}
        historical={scoreSnapshot.historical}
        overall={scoreSnapshot.overall}
        participantCount={visit.participantCount}
        photos={visit.photos}
        restaurant={visit.restaurant}
        scores={scoreSnapshot.scores}
        visitedAt={visit.visitedAt}
      />
    </PublicShell>
  );
}
