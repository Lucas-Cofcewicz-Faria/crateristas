import { notFound } from 'next/navigation';
import { MemberProfile } from '@/features/members/MemberProfile';
import { getReviewRepository } from '@/lib/reviews/server';
import { findOptionalMember } from '@/lib/auth/access';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Perfil do craterista | Crateristas' };

export default async function MemberProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [members, viewer] = await Promise.all([getReviewRepository().listPublicMembers(), findOptionalMember()]);
  const member = members.find((candidate) => candidate.slug === slug);
  if (!member) notFound();
  return <><MemberProfile member={member} isOwner={viewer?.slug === slug} /></>;
}
