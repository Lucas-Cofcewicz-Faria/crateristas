import { PublicShell } from '@/components/shell/PublicShell';
import { DashboardView } from '@/features/visits/DashboardView';
import { requireMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const member = await requireMember();
  const repository = getReviewRepository();
  const [awaiting, forming, publicVisits] = await Promise.all([
    repository.listPendingVisitsForMember(member.id),
    repository.listVisitsInFormationForMember(member.id),
    repository.listPublicVisits({}),
  ]);
  const recent = publicVisits.slice(0, 6).map((visit) => ({
    id: visit.id,
    slug: visit.slug,
    restaurantName: visit.restaurant.name,
    visitedAt: visit.visitedAt,
    participantCount: visit.participantCount,
  }));

  return (
    <PublicShell viewer="member">
      <DashboardView
        awaiting={awaiting}
        forming={forming}
        isAdmin={member.role === 'admin'}
        memberName={member.displayName}
        recent={recent}
      />
    </PublicShell>
  );
}
