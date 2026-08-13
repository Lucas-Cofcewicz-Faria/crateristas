import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/shell/PublicShell';
import { ReviewWorkspace } from '@/features/visits/ReviewWorkspace';
import styles from '@/features/visits/review-workflow.module.css';
import { requireMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

type EvaluateVisitPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

export default async function EvaluateVisitPage({ params }: EvaluateVisitPageProps) {
  const member = await requireMember();
  const repository = getReviewRepository();
  const { id } = await params;
  const workspace = await repository.getVisitReviewWorkspace(id, member.id);
  if (!workspace) notFound();

  return (
    <PublicShell viewer="member">
      <section className={styles.workflowPage}>
        <ReviewWorkspace
          canManagePhotos={member.role === 'admin' || workspace.createdBy === member.id}
          city={workspace.city}
          cuisine={workspace.cuisine}
          initialParticipantCount={workspace.participantCount}
          initialPhotos={workspace.photos}
          initialPublicationState={workspace.publicationState}
          isAdmin={member.role === 'admin'}
          key={`${workspace.id}:${workspace.participantCount}:${workspace.publicationState}`}
          neighborhood={workspace.neighborhood}
          ownScorecard={workspace.ownScorecard}
          quorum={workspace.quorum}
          restaurantName={workspace.restaurantName}
          visitId={workspace.id}
        />
      </section>
    </PublicShell>
  );
}
