import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/shell/PublicShell';
import { AdminPublicationControls } from '@/features/visits/AdminPublicationControls';
import { PublicationStatus } from '@/features/visits/PublicationStatus';
import { PhotoUploader } from '@/features/visits/PhotoUploader';
import { ScorecardForm } from '@/features/visits/ScorecardForm';
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
        <header className={styles.workflowHeader}>
          <div>
            <p className={styles.eyebrow}>Contribuição reservada</p>
            <h1>Avaliar {workspace.restaurantName}</h1>
            <p className={styles.lead}>
              {workspace.cuisine} · {workspace.neighborhood}, {workspace.city}
            </p>
          </div>
          <div className={styles.visitSummary}>
            <PublicationStatus state={workspace.publicationState} />
            <p>{workspace.participantCount} de {workspace.quorum} membros contribuíram</p>
          </div>
        </header>
        <ScorecardForm initialValues={workspace.ownScorecard} visitId={workspace.id} />
        <PhotoUploader
          canManage={member.role === 'admin' || workspace.createdBy === member.id}
          initialPhotos={workspace.photos}
          visitId={workspace.id}
        />
        <AdminPublicationControls
          initialState={workspace.publicationState}
          isAdmin={member.role === 'admin'}
          participantCount={workspace.participantCount}
          visitId={workspace.id}
        />
      </section>
    </PublicShell>
  );
}
