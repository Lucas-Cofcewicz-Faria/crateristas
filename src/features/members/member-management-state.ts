export interface ManagedMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  societyTitle?: string | null;
  role: 'member' | 'admin';
  scorecardCount: number;
  removedAt: string | null;
}

export const MEMBER_REMOVAL_CONFIRMATION = 'Remover integrante';
