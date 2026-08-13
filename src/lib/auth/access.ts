import type { MemberRecord } from '@/domain/reviews/repository';
import { auth } from '@/lib/auth/server';
import { createNeonReviewRepository } from '@/lib/repositories/neon-review-repository';

export class AuthenticationError extends Error {
  constructor() {
    super('Sessão expirada. Entre novamente.');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super('Você não tem permissão para realizar esta ação.');
    this.name = 'AuthorizationError';
  }
}

export async function findOptionalMember(): Promise<MemberRecord | null> {
  const { data } = await auth.getSession();
  if (!data?.user?.id) return null;

  return createNeonReviewRepository().findMemberByAuthUserId(data.user.id);
}

export async function requireMember(): Promise<MemberRecord> {
  const { data } = await auth.getSession();
  if (!data?.user?.id) throw new AuthenticationError();

  const repository = createNeonReviewRepository();
  const member = await repository.findMemberByAuthUserId(data.user.id);
  if (!member) throw new AuthorizationError();

  return member;
}

export async function requireAdmin(): Promise<MemberRecord> {
  const member = await requireMember();
  if (member.role !== 'admin') throw new AuthorizationError();

  return member;
}
