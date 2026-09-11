import { PublicShell } from '@/components/shell/PublicShell';
import { DashboardView } from '@/features/visits/DashboardView';
import { requireMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';
import { InviteManager } from '@/features/auth/InviteManager';
import { readSharedInvite } from '@/features/auth/invite-repository';
import { MemberManager } from '@/features/members/MemberManager';
import { listManagedMembers } from '@/features/members/member-administration';

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
      : repository.listVisitsForManagement(member.id),
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
        adminTools={member.role === 'admin' ? <>
          <MemberManager currentMemberId={member.id} members={await listManagedMembers(member.id)} />
          <InviteManager initialInvite={await readSharedInvite()} />
        </> : undefined}
      />
    </PublicShell>
  );
}
