import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ScorecardInput } from '@/domain/reviews/schemas';
import { confirmUploadedPhoto, createVisit, submitScorecard } from './visit-api';

const visitId = '11111111-1111-4111-8111-111111111111';
const scorecard: ScorecardInput = {
  food: 8,
  service: 7,
  ambience: 9,
  value: 6,
  access: 5,
  waitTime: 4,
  comment: 'Minha ficha.',
};
const validAggregate = {
  participantCount: 6,
  averages: {
    food: 8.2,
    service: 7.5,
    ambience: 8.7,
    value: 7,
    access: 6.5,
    waitTime: 6,
  },
  overall: 7.3,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function successfulJson(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('contratos de resposta do client de visitas', () => {
  it('aceita UUID/slug reais da criação e remove campos que não pertencem ao client', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulJson({
      id: visitId,
      slug: 'mesa-segura-2026-08-10-2',
      publicationState: 'private',
      authUserId: 'não-deve-cruzar',
    })));

    await expect(createVisit({
      restaurantName: 'Mesa Segura',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      visitedAt: '2026-08-10',
    })).resolves.toEqual({
      id: visitId,
      slug: 'mesa-segura-2026-08-10-2',
      publicationState: 'private',
    });
  });

  it.each([
    ['ID não UUID', { id: 'visit-1', slug: 'mesa-2026-08-10', publicationState: 'private' }],
    ['slug vazio', { id: visitId, slug: '', publicationState: 'private' }],
    ['slug inseguro', { id: visitId, slug: '../Mesa Segura', publicationState: 'private' }],
  ])('rejeita 2xx de criação com %s', async (_label, payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulJson(payload)));

    await expect(createVisit({
      restaurantName: 'Mesa Segura',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      visitedAt: '2026-08-10',
    })).rejects.toThrow('create_visit_failed');
  });

  it('aceita e reduz a resposta coerente do scorecard à allowlist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulJson({
      participantCount: 6,
      publicationState: 'published',
      aggregate: validAggregate,
      individualScores: { food: 10 },
      publicationReason: 'quorum',
    })));

    await expect(submitScorecard(visitId, scorecard)).resolves.toEqual({
      participantCount: 6,
      publicationState: 'published',
      aggregate: validAggregate,
    });
  });

  it.each([
    ['zero participantes após upsert', {
      participantCount: 0,
      aggregate: { participantCount: 0, averages: null, overall: null },
    }],
    ['participantes fracionários', { participantCount: 1.5 }],
    ['participantes acima do grupo', { participantCount: 9 }],
    ['estado inválido', { publicationState: 'draft' }],
    ['contagens divergentes', { aggregate: { ...validAggregate, participantCount: 5 } }],
    ['médias incompletas', { aggregate: { ...validAggregate, averages: { food: 8 } } }],
    ['médias nulas com participante', { aggregate: { ...validAggregate, averages: null } }],
    ['média fora de 0..10', {
      aggregate: {
        ...validAggregate,
        averages: { ...validAggregate.averages, service: 11 },
      },
    }],
    ['overall fora de 0..10', { aggregate: { ...validAggregate, overall: -1 } }],
    ['overall nulo com participante', { aggregate: { ...validAggregate, overall: null } }],
  ])('rejeita 2xx malformado do scorecard: %s', async (_label, replacement) => {
    const payload = {
      participantCount: 6,
      publicationState: 'published',
      aggregate: validAggregate,
      ...replacement,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(successfulJson(payload)));

    await expect(submitScorecard(visitId, scorecard)).rejects.toThrow(
      'submit_scorecard_failed',
    );
  });

  it('interrompe o polling de confirmação quando o AbortSignal é cancelado', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ photo: null }), { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const confirmation = confirmUploadedPhoto(
      visitId,
      `visits/${visitId}/foto-AbCd12.webp`,
      controller.signal,
    );

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    controller.abort();

    await expect(confirmation).rejects.toThrow();
    await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('limita o polling a cinco consultas com backoff de 3,75 segundos', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ photo: null }), { status: 202 }),
    );
    const wait = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await expect(confirmUploadedPhoto(
      visitId,
      `visits/${visitId}/foto-AbCd12.webp`,
      controller.signal,
      { wait },
    )).rejects.toThrow('confirm_photo_failed');

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(wait.mock.calls).toEqual([
      [250, controller.signal],
      [500, controller.signal],
      [1_000, controller.signal],
      [2_000, controller.signal],
    ]);
  });
});
