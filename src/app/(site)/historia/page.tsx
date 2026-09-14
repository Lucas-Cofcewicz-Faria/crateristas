import { HistoryNarrative } from '@/features/history/HistoryNarrative';
import { findOptionalMember } from '@/lib/auth/access';
import { getReviewRepository } from '@/lib/reviews/server';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const repository = getReviewRepository();
  const [members, viewer] = await Promise.all([
    repository.listPublicMembers(),
    findOptionalMember(),
  ]);

  return (
    <>
      <HistoryNarrative members={members} showPanelLink={Boolean(viewer)} />
    </>
  );
}
