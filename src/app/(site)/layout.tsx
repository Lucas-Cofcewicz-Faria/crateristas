import type { ReactNode } from 'react';
import { PublicShell } from '@/components/shell/PublicShell';
import { findOptionalMember } from '@/lib/auth/access';

/** The shell belongs to the route group, never to page/loading boundaries. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const member = await findOptionalMember();
  return <PublicShell viewer={member ? 'member' : 'visitor'}>{children}</PublicShell>;
}
