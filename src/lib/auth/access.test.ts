import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  getSession: vi.fn(),
  findMemberByAuthUserId: vi.fn(),
}));

vi.mock('./server', () => ({
  auth: { getSession: dependencies.getSession },
}));

vi.mock('@/lib/repositories/neon-review-repository', () => ({
  createNeonReviewRepository: () => ({
    findMemberByAuthUserId: dependencies.findMemberByAuthUserId,
  }),
}));

import {
  AuthenticationError,
  AuthorizationError,
  findOptionalMember,
  requireAdmin,
  requireMember,
} from './access';

const regularMember: MemberRecord = {
  id: 'member-1',
  authUserId: 'auth-user-1',
  email: 'ana@example.com',
  slug: 'ana',
  displayName: 'Ana',
  avatarUrl: null,
  societyTitle: null,
  memberNumber: 1,
  bio: 'Integrante da sociedade.',
  favoriteCuisine: null,
  role: 'member',
};

const adminMember: MemberRecord = {
  ...regularMember,
  id: 'member-admin',
  authUserId: 'auth-admin',
  email: 'admin@example.com',
  slug: 'admin',
  displayName: 'Administrador',
  memberNumber: 8,
  role: 'admin',
};

function authenticatedSession(authUserId: string) {
  const now = new Date('2026-08-11T12:00:00.000Z');

  return {
    data: {
      session: {
        id: 'session-1',
        createdAt: now,
        updatedAt: now,
        userId: authUserId,
        expiresAt: new Date('2026-08-12T12:00:00.000Z'),
        token: 'session-token',
        ipAddress: null,
        userAgent: null,
      },
      user: {
        id: authUserId,
        createdAt: now,
        updatedAt: now,
        email: 'membro@example.com',
        emailVerified: true,
        name: 'Membro',
        image: null,
      },
    },
    error: null,
  };
}

describe('controle de acesso dos membros', () => {
  beforeEach(() => {
    dependencies.getSession.mockReset();
    dependencies.findMemberByAuthUserId.mockReset();
  });

  it('rejeita uma requisicao sem sessao autenticada', async () => {
    dependencies.getSession.mockResolvedValue({ data: null, error: null });

    await expect(requireMember()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejeita um usuario autenticado que nao foi provisionado como membro', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession('auth-desconhecido'));
    dependencies.findMemberByAuthUserId.mockResolvedValue(null);

    await expect(requireMember()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('resolve o membro provisionado pelo id do usuario autenticado', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession('auth-user-1'));
    dependencies.findMemberByAuthUserId.mockImplementation(async (authUserId: string) =>
      authUserId === regularMember.authUserId ? regularMember : null,
    );

    await expect(requireMember()).resolves.toEqual(regularMember);
  });

  it('resolve uma visita pública sem sessão como visitante', async () => {
    dependencies.getSession.mockResolvedValue({ data: null, error: null });

    await expect(findOptionalMember()).resolves.toBeNull();
    expect(dependencies.findMemberByAuthUserId).not.toHaveBeenCalled();
  });

  it('não concede UI de membro a um usuário autenticado ainda não provisionado', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession('auth-desconhecido'));
    dependencies.findMemberByAuthUserId.mockResolvedValue(null);

    await expect(findOptionalMember()).resolves.toBeNull();
  });

  it('identifica opcionalmente uma sessão provisionada sem usar erro como controle', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession('auth-user-1'));
    dependencies.findMemberByAuthUserId.mockResolvedValue(regularMember);

    await expect(findOptionalMember()).resolves.toEqual(regularMember);
  });

  it('impede um membro comum de executar uma operacao administrativa', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession('auth-user-1'));
    dependencies.findMemberByAuthUserId.mockResolvedValue(regularMember);

    await expect(requireAdmin()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('permite que o administrador execute uma operacao administrativa', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession('auth-admin'));
    dependencies.findMemberByAuthUserId.mockResolvedValue(adminMember);

    await expect(requireAdmin()).resolves.toEqual(adminMember);
  });
});
