import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MemberRecord, VisitRecord } from '@/domain/reviews/repository';
import { AuthenticationError, AuthorizationError } from '@/lib/auth/access';

const dependencies = vi.hoisted(() => ({
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  requireMember: vi.fn(),
  requireAdmin: vi.fn(),
  createVisit: vi.fn(),
  submitScorecard: vi.fn(),
  changePublication: vi.fn(),
}));

vi.mock('@/lib/auth/access', () => ({
  AuthenticationError: dependencies.AuthenticationError,
  AuthorizationError: dependencies.AuthorizationError,
  requireMember: dependencies.requireMember,
  requireAdmin: dependencies.requireAdmin,
}));

vi.mock('@/lib/reviews/server', () => ({
  getReviewService: () => ({
    createVisit: dependencies.createVisit,
    submitScorecard: dependencies.submitScorecard,
    changePublication: dependencies.changePublication,
  }),
}));

import { POST as createVisit } from './route';
import { PUT as submitScorecard } from './[id]/scorecard/route';
import { PATCH as changePublication } from './[id]/publication/route';

const member: MemberRecord = {
  id: 'member-1',
  authUserId: 'auth-member-1',
  email: 'membro@example.com',
  slug: 'membro-1',
  displayName: 'Membro 1',
  avatarUrl: null,
  societyTitle: null,
  memberNumber: 1,
  bio: 'Integrante da sociedade.',
  favoriteCuisine: 'Brasileira',
  role: 'member',
};

const admin: MemberRecord = {
  ...member,
  id: 'member-8',
  authUserId: 'auth-member-8',
  email: 'admin@example.com',
  slug: 'administrador',
  displayName: 'Administrador',
  memberNumber: 8,
  role: 'admin',
};

const visit: VisitRecord = {
  id: 'visit-1',
  slug: 'casa-teste-2026-08-10',
  restaurantId: 'restaurant-1',
  createdBy: admin.id,
  visitedAt: '2026-08-10',
  quorum: 6,
  publicationState: 'private',
  publicationReason: null,
  publishedAt: null,
  publishedBy: null,
  hiddenAt: null,
  hiddenBy: null,
  legacyReviewId: null,
  legacyPayload: null,
};

const createVisitInput = {
  restaurantName: 'Casa Teste',
  cuisine: 'Brasileira',
  neighborhood: 'Centro',
  city: 'São Paulo',
  address: 'Rua do Buraco, 10',
  priceBand: '$$',
  visitedAt: '2026-08-10',
};

const scorecardInput = {
  food: 8,
  service: 7,
  ambience: 9,
  value: 6,
  access: 5,
  waitTime: 4,
  comment: 'A sobremesa salvou a expedição.',
};

const aggregate = {
  participantCount: 6,
  averages: {
    food: 7.5,
    service: 7,
    ambience: 8,
    value: 6.5,
    access: 5,
    waitTime: 4.5,
  },
  overall: 6.4,
};

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest(url: string, method: string): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  dependencies.requireMember.mockResolvedValue(member);
  dependencies.requireAdmin.mockResolvedValue(admin);
  dependencies.createVisit.mockResolvedValue(visit);
  dependencies.submitScorecard.mockResolvedValue({
    visitId: visit.id,
    publicationState: 'published',
    publicationReason: 'quorum',
    participantCount: 6,
    aggregate,
    publicationChanged: true,
    individualScores: scorecardInput,
  });
  dependencies.changePublication.mockResolvedValue({
    ...visit,
    publicationState: 'published',
    publicationReason: 'admin_override',
    publishedAt: '2026-08-11T12:00:00.000Z',
    publishedBy: admin.id,
  });
});

describe('POST /api/visits', () => {
  it('autentica antes de ler um corpo invalido e devolve 401 em pt-BR', async () => {
    dependencies.requireMember.mockRejectedValue(new AuthenticationError());

    const response = await createVisit(malformedJsonRequest('http://localhost/api/visits', 'POST'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Sessão expirada. Entre novamente.',
    });
    expect(dependencies.createVisit).not.toHaveBeenCalled();
  });

  it('cria uma visita com o ator autenticado e retorna apenas o contrato necessario', async () => {
    const response = await createVisit(
      jsonRequest('http://localhost/api/visits', 'POST', createVisitInput),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: 'visit-1',
      slug: 'casa-teste-2026-08-10',
      publicationState: 'private',
    });
    expect(dependencies.createVisit).toHaveBeenCalledTimes(1);
    expect(dependencies.createVisit).toHaveBeenCalledWith(member, createVisitInput);
    expect(dependencies.submitScorecard).not.toHaveBeenCalled();
    expect(dependencies.changePublication).not.toHaveBeenCalled();
  });
});

describe('PUT /api/visits/[id]/scorecard', () => {
  it('devolve field errors para uma nota fora do intervalo sem chamar o servico', async () => {
    const response = await submitScorecard(
      jsonRequest('http://localhost/api/visits/visit-1/scorecard', 'PUT', {
        ...scorecardInput,
        food: 11,
      }),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Revise os campos informados.',
      fields: { food: ['A nota máxima é 10.'] },
    });
    expect(dependencies.submitScorecard).not.toHaveBeenCalled();
  });

  it('aguarda o parametro, chama uma operacao e retorna somente o agregado coletivo', async () => {
    const response = await submitScorecard(
      jsonRequest('http://localhost/api/visits/visit-1/scorecard', 'PUT', scorecardInput),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      participantCount: 6,
      publicationState: 'published',
      aggregate,
    });
    expect(dependencies.submitScorecard).toHaveBeenCalledTimes(1);
    expect(dependencies.submitScorecard).toHaveBeenCalledWith(member, 'visit-1', scorecardInput);
    expect(dependencies.createVisit).not.toHaveBeenCalled();
    expect(dependencies.changePublication).not.toHaveBeenCalled();
  });

  it('trata JSON malformado como 400 sem vazar detalhes tecnicos', async () => {
    const response = await submitScorecard(
      malformedJsonRequest('http://localhost/api/visits/visit-1/scorecard', 'PUT'),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'O corpo da requisição deve conter JSON válido.',
    });
    expect(dependencies.submitScorecard).not.toHaveBeenCalled();
  });

  it('nao expoe a mensagem de um erro interno desconhecido', async () => {
    dependencies.submitScorecard.mockRejectedValue(new Error('senha=segredo-interno'));

    const response = await submitScorecard(
      jsonRequest('http://localhost/api/visits/visit-1/scorecard', 'PUT', scorecardInput),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Não foi possível concluir a operação.',
    });
  });
});

describe('PATCH /api/visits/[id]/publication', () => {
  it('devolve 403 para membro comum antes de alterar a publicacao', async () => {
    dependencies.requireAdmin.mockRejectedValue(new AuthorizationError());

    const response = await changePublication(
      jsonRequest('http://localhost/api/visits/visit-1/publication', 'PATCH', 'publish_early'),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Você não tem permissão para esta ação.',
    });
    expect(dependencies.changePublication).not.toHaveBeenCalled();
  });

  it.each(['publish_early', 'hide', 'republish'] as const)(
    'aceita o comando administrativo %s e chama uma operacao',
    async (command) => {
      const expected = command === 'hide'
        ? { publicationState: 'hidden' as const, publicationReason: null }
        : { publicationState: 'published' as const, publicationReason: 'admin_override' as const };
      dependencies.changePublication.mockResolvedValueOnce({
        ...visit,
        ...expected,
      });
      const response = await changePublication(
        jsonRequest('http://localhost/api/visits/visit-1/publication', 'PATCH', command),
        { params: Promise.resolve({ id: 'visit-1' }) },
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(expected);
      expect(dependencies.changePublication).toHaveBeenCalledTimes(1);
      expect(dependencies.changePublication).toHaveBeenCalledWith(admin, 'visit-1', command);
      expect(dependencies.createVisit).not.toHaveBeenCalled();
      expect(dependencies.submitScorecard).not.toHaveBeenCalled();
    },
  );

  it('rejeita qualquer outro comando administrativo com 400', async () => {
    const response = await changePublication(
      jsonRequest('http://localhost/api/visits/visit-1/publication', 'PATCH', 'erase'),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Revise os campos informados.',
      fields: {},
    });
    expect(dependencies.changePublication).not.toHaveBeenCalled();
  });

  it('registra um diagnostico estruturado quando a publicacao falha no banco', async () => {
    const databaseError = Object.assign(
      new Error('column "deletion_started_at" does not exist'),
      {
        code: '42703',
        column: 'deletion_started_at',
      },
    );
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    dependencies.changePublication.mockRejectedValueOnce(databaseError);

    const response = await changePublication(
      jsonRequest('http://localhost/api/visits/visit-1/publication', 'PATCH', 'hide'),
      { params: Promise.resolve({ id: 'visit-1' }) },
    );

    expect(response.status).toBe(500);
    expect(errorLog).toHaveBeenCalledWith('publication_change_failed', {
      name: 'Error',
      message: 'column "deletion_started_at" does not exist',
      code: '42703',
      column: 'deletion_started_at',
    });
    errorLog.mockRestore();
  });
});
