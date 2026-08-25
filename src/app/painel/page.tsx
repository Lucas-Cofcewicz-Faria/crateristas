import { PublicShell } from '@/components/shell/PublicShell';
import { DashboardView } from '@/features/visits/DashboardView';
import { requireMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const member = await requireMember();
  const repository = getReviewRepository();
  const [awaiting, forming, recent, managed] = await Promise.all([
    repository.listPendingVisitsForMember(member.id),
    repository.listVisitsInFormationForMember(member.id),
    repository.listRecentPublishedVisits(6),
    member.role === 'admin'
      ? repository.listVisitsForAdministration(member.id)
      : Promise.resolve([]),
  ]);

  return (
    <PublicShell viewer="member">
      <DashboardView
        awaiting={awaiting}
        forming={forming}
        isAdmin={member.role === 'admin'}
        managed={managed}
        memberName={member.displayName}
        recent={recent}
      />
    </PublicShell>
  );
}
