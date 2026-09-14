import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PublicVisitDetail } from '@/domain/reviews/repository';
import type { PublicationState } from '@/domain/reviews/types';
import { RestaurantReview } from '@/features/restaurant/RestaurantReview';
import {
  formatScore,
  formatVisitDate,
  getVisitScoreSnapshot,
} from '@/features/restaurant/restaurant-formatters';
import { getPublicVisitDetail, getRestaurantVisitPage } from './data';
import { findOptionalMember } from '@/lib/auth/access';

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ visita?: string }>;
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

export async function generateMetadata({ params, searchParams }: RestaurantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await findOptionalMember();
  const visit = member
    ? (await getRestaurantVisitPage(slug, (await searchParams)?.visita, member.id))?.visit ?? null
    : await getPublicVisitDetail(slug, (await searchParams)?.visita);
  if (!visit) notFound();
  return metadataForVisit(visit);
}

export default async function RestaurantPage({ params, searchParams }: RestaurantPageProps) {
  const { slug } = await params;
  const member = await findOptionalMember();
  const visitId = (await searchParams)?.visita;
  const page = member
    ? await getRestaurantVisitPage(slug, visitId, member.id)
    : await getRestaurantVisitPage(slug, visitId);
  if (!page) notFound();
  const { visit, restaurant, visits } = page;

  const scoreSnapshot = getVisitScoreSnapshot(visit);

  return (
    <>
      <RestaurantReview
        comments={visit.comments}
        historical={scoreSnapshot.historical}
        overall={scoreSnapshot.overall}
        participantCount={visit.participantCount}
        photos={visit.photos}
        restaurant={visit.restaurant}
        scores={scoreSnapshot.scores}
        visitedAt={visit.visitedAt}
        visits={visits}
        selectedVisitId={visit.id}
        menuEnabled={restaurant.menuEnabled}
        publicationState={('publicationState' in visit ? visit.publicationState : 'published') as PublicationState}
      />
    </>
  );
}
