import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord } from '@/domain/reviews/repository';

const dependencies = vi.hoisted(() => ({
  findMemberByAuthUserId: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@neondatabase/auth/next/server', () => ({
  createNeonAuth: vi.fn(),
}));

vi.mock('@/lib/auth/server', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/auth/server')>();
  return {
    ...original,
    auth: { ...original.auth, getSession: dependencies.getSession },
  };
});

vi.mock('@/lib/repositories/neon-review-repository', () => ({
  createNeonReviewRepository: () => ({
    findMemberByAuthUserId: dependencies.findMemberByAuthUserId,
  }),
}));

import RestaurantNotFound from './not-found';
import { AuthConfigurationError } from '@/lib/auth/server';

afterEach(cleanup);

const member: MemberRecord = {
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

function authenticatedSession(authUserId: string) {
  const now = new Date('2026-08-13T12:00:00.000Z');

  return {
    data: {
      session: {
        id: 'session-1',
        createdAt: now,
        updatedAt: now,
        userId: authUserId,
        expiresAt: new Date('2026-08-14T12:00:00.000Z'),
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

describe('estado não encontrado de uma visita pública', () => {
  beforeEach(() => {
    dependencies.findMemberByAuthUserId.mockReset();
    dependencies.getSession.mockReset();
  });

  it('preserva a navegação de um membro provisionado', async () => {
    dependencies.getSession.mockResolvedValue(authenticatedSession(member.authUserId));
    dependencies.findMemberByAuthUserId.mockResolvedValue(member);

    render(await RestaurantNotFound());

    expect(screen.getByRole('link', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('degrada Auth não configurado para a navegação de visitante', async () => {
    dependencies.getSession.mockImplementation(() => {
      throw new AuthConfigurationError('NEON_AUTH_BASE_URL não configurada.');
    });

    render(await RestaurantNotFound());

    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument();
    expect(dependencies.getSession).toHaveBeenCalledOnce();
    expect(dependencies.findMemberByAuthUserId).not.toHaveBeenCalled();
  });
});
