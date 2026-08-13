import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AtomicScorecardSubmissionInput } from '@/domain/reviews/repository';
import {
  createNeonReviewRepository,
  type ReviewSqlClient,
} from './neon-review-repository';

const scorecard = {
  food: 8,
  service: 7,
  ambience: 9,
  value: 6,
  access: 5,
  waitTime: 4,
  comment: 'Comentário específico da integração.',
};

function atomicSubmission(): AtomicScorecardSubmissionInput {
  return {
    visitId: randomUUID(),
    memberId: randomUUID(),
    scorecard,
    expectedPublicationState: 'private',
    quorum: 6,
    transitionAtQuorum: { state: 'published', reason: 'quorum' },
  };
}

describe('NeonReviewRepository', () => {
  it('maps complete internal members by auth user id and member id', async () => {
    const memberRow = {
      id: 'member-1',
      auth_user_id: 'auth-1',
      email: 'member-1@example.com',
      slug: 'member-1',
      display_name: 'Membro 1',
      avatar_url: null,
      society_title: 'Fundador',
      member_number: 1,
      bio: 'Bio',
      favorite_cuisine: 'Brasileira',
      role: 'member',
    };
    const sql = {
      query: async (_text: string, params: unknown[]) => (
        params[0] === 'auth-1' || params[0] === 'member-1' ? [memberRow] : []
      ),
      transaction: async () => {
        throw new Error('Lookup não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const byAuth = await repository.findMemberByAuthUserId('auth-1');
    const byId = await repository.findMemberById('member-1');

    expect(byAuth).toEqual({
      id: 'member-1',
      authUserId: 'auth-1',
      email: 'member-1@example.com',
      slug: 'member-1',
      displayName: 'Membro 1',
      avatarUrl: null,
      societyTitle: 'Fundador',
      memberNumber: 1,
      bio: 'Bio',
      favoriteCuisine: 'Brasileira',
      role: 'member',
    });
    expect(byId).toEqual(byAuth);
    await expect(repository.findMemberById('missing')).resolves.toBeNull();
  });

  it('finds visits and creates a visit with a deterministic base slug in one statement', async () => {
    const visitRow = {
      id: 'visit-1',
      slug: 'cafe-do-joao-2026-08-10',
      restaurant_id: 'restaurant-1',
      created_by: 'member-1',
      visited_at: '2026-08-10',
      quorum: 6,
      publication_state: 'private',
      publication_reason: null,
      published_at: null,
      published_by: null,
      hidden_at: null,
      hidden_by: null,
      legacy_review_id: null,
      legacy_payload: null,
    };
    const sql = {
      query: async (_text: string, params: unknown[]) => params[0] === 'visit-1' ? [visitRow] : [],
      transaction: async (factory: (transaction: { query: (text: string, params: unknown[]) => unknown }) => unknown[]) => {
        const queries = factory({ query: (text, params) => ({ text, params }) }) as Array<{ params: unknown[] }>;
        if (queries.length !== 1 || !queries[0].params.includes('cafe-do-joao-2026-08-10')) {
          throw new Error('Slug base ou statement de criação incorreto.');
        }
        return [[visitRow]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.findVisitById('visit-1')).resolves.toMatchObject({
      id: 'visit-1',
      publicationState: 'private',
    });
    await expect(repository.createVisit('member-1', {
      restaurantName: 'Café do João',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      visitedAt: '2026-08-10',
    })).resolves.toMatchObject({
      slug: 'cafe-do-joao-2026-08-10',
      createdBy: 'member-1',
    });
  });

  it('supports the primitive scorecard and publication methods in the repository contract', async () => {
    const publishedVisit = {
      id: 'visit-1',
      slug: 'casa-teste',
      restaurant_id: 'restaurant-1',
      created_by: 'member-1',
      visited_at: '2026-08-10',
      quorum: 6,
      publication_state: 'published',
      publication_reason: 'admin_override',
      published_at: '2026-08-11T12:00:00.000Z',
      published_by: 'admin-1',
      hidden_at: null,
      hidden_by: null,
      legacy_review_id: null,
      legacy_payload: null,
    };
    const sql = {
      query: async (text: string) => {
        if (text.includes('COUNT(*)')) return [{ participant_count: 2 }];
        if (text.includes('UPDATE visits')) return [publishedVisit];
        return [];
      },
      transaction: async () => {
        throw new Error('Método primitivo não deve abrir transação própria.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.upsertScorecard('visit-1', 'member-1', scorecard)).resolves.toBeUndefined();
    await expect(repository.countScorecards('visit-1')).resolves.toBe(2);
    await expect(repository.updatePublication(
      'visit-1',
      'published',
      'admin_override',
      'admin-1',
    )).resolves.toMatchObject({ publicationState: 'published', publishedBy: 'admin-1' });
    await expect(repository.recordPublicationEvent({
      visitId: 'visit-1',
      actorId: 'admin-1',
      action: 'publish_early',
      participantCount: 2,
    })).resolves.toBeUndefined();
  });

  it('finds, counts, and deletes photos while preserving the deleted metadata', async () => {
    const photoRow = {
      id: 'photo-1',
      visit_id: 'visit-1',
      uploaded_by: 'member-1',
      url: 'https://images.example.com/photo.webp',
      pathname: 'visits/visit-1/photo.webp',
      content_type: 'image/webp',
      size_bytes: 100_000,
      position: 1,
    };
    const sql = {
      query: async (text: string) => {
        if (text.includes('COUNT(*)')) return [{ photo_count: 2 }];
        return [photoRow];
      },
      transaction: async () => {
        throw new Error('Método primitivo não deve abrir transação própria.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.findPhotoById('photo-1')).resolves.toMatchObject({
      id: 'photo-1',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    });
    await expect(repository.countVisitPhotos('visit-1')).resolves.toBe(2);
    await expect(repository.deletePhoto('visit-1', 'photo-1', 'member-1')).resolves.toMatchObject({
      pathname: 'visits/visit-1/photo.webp',
      uploadedBy: 'member-1',
    });
  });

  it('submits a scorecard through the transaction boundary', async () => {
    const transactionRows = [{
      visit_id: 'visit-1',
      publication_state: 'published',
      publication_reason: 'quorum',
      participant_count: 6,
      average_food: 7.5,
      average_service: 7,
      average_ambience: 8,
      average_value: 6.5,
      average_access: 5,
      average_wait_time: 4.5,
      overall: 6.4,
      publication_changed: true,
    }];
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async (factory: (transaction: { query: (text: string, params: unknown[]) => unknown }) => unknown[]) => {
        const queries = factory({ query: (text, params) => ({ text, params }) });
        if (queries.length !== 1) throw new Error('A operação composta deve usar uma única statement.');
        return [transactionRows];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const result = await repository.submitScorecardAtomically(atomicSubmission());

    expect(result).toEqual({
      visitId: 'visit-1',
      publicationState: 'published',
      publicationReason: 'quorum',
      participantCount: 6,
      aggregate: {
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
      },
      publicationChanged: true,
    });
  });

  it('retries a serialization failure so a concurrent scorecard is not lost', async () => {
    let attempt = 0;
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async () => {
        attempt += 1;
        if (attempt === 1) {
          throw Object.assign(new Error('could not serialize access'), { code: '40001' });
        }
        return [[{
          visit_id: 'visit-1',
          publication_state: 'published',
          publication_reason: 'quorum',
          participant_count: 6,
          average_food: 8,
          average_service: 7,
          average_ambience: 9,
          average_value: 6,
          average_access: 5,
          average_wait_time: 4,
          overall: 6.5,
          publication_changed: true,
        }]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.submitScorecardAtomically(atomicSubmission())).resolves.toMatchObject({
      publicationState: 'published',
      participantCount: 6,
    });
  });

  it('retries serialization failures for administrative changes and photo allocation', async () => {
    const visitRow = {
      id: 'visit-1',
      slug: 'casa-teste',
      restaurant_id: 'restaurant-1',
      created_by: 'admin-1',
      visited_at: '2026-08-10',
      quorum: 6,
      publication_state: 'hidden',
      publication_reason: null,
      published_at: '2026-08-11T12:00:00.000Z',
      published_by: null,
      hidden_at: '2026-08-11T13:00:00.000Z',
      hidden_by: 'admin-1',
      legacy_review_id: null,
      legacy_payload: null,
    };
    let attempt = 0;
    let operation = 0;
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async () => {
        attempt += 1;
        if (attempt % 2 === 1) {
          throw Object.assign(new Error('could not serialize access'), { code: '40001' });
        }
        operation += 1;
        return operation === 1 ? [[visitRow]] : [[{ id: 'photo-1', visit_id: 'visit-1' }]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.changePublicationAtomically({
      visitId: 'visit-1',
      expectedPublicationState: 'published',
      state: 'hidden',
      reason: null,
      actorId: 'admin-1',
      action: 'hide',
    })).resolves.toMatchObject({ publicationState: 'hidden' });
    await expect(repository.attachPhoto('visit-1', 'member-1', {
      url: 'https://images.example.com/photo.webp',
      pathname: 'visits/visit-1/photo.webp',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    })).resolves.toBeUndefined();
  });

  it('changes publication state and records its event through the transaction boundary', async () => {
    const transactionRows = [{
      id: 'visit-1',
      slug: 'casa-teste',
      restaurant_id: 'restaurant-1',
      created_by: 'admin-1',
      visited_at: '2026-08-10',
      quorum: 6,
      publication_state: 'hidden',
      publication_reason: null,
      published_at: '2026-08-11T12:00:00.000Z',
      published_by: null,
      hidden_at: '2026-08-11T13:00:00.000Z',
      hidden_by: 'admin-1',
      legacy_review_id: null,
      legacy_payload: null,
    }];
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async (factory: (transaction: { query: (text: string, params: unknown[]) => unknown }) => unknown[]) => {
        const queries = factory({ query: (text, params) => ({ text, params }) });
        if (queries.length !== 1) throw new Error('A operação composta deve usar uma única statement.');
        return [transactionRows];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const result = await repository.changePublicationAtomically({
      visitId: 'visit-1',
      expectedPublicationState: 'published',
      state: 'hidden',
      reason: null,
      actorId: 'admin-1',
      action: 'hide',
    });

    expect(result).toMatchObject({
      id: 'visit-1',
      publicationState: 'hidden',
      hiddenBy: 'admin-1',
    });
  });

  it('allocates a photo position and inserts it through the transaction boundary', async () => {
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async (factory: (transaction: { query: (text: string, params: unknown[]) => unknown }) => unknown[]) => {
        const queries = factory({ query: (text, params) => ({ text, params }) });
        if (queries.length !== 1) throw new Error('Posição e insert devem compartilhar uma statement.');
        return [[{ id: 'photo-1' }]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.attachPhoto('visit-1', 'member-1', {
      url: 'https://images.example.com/photo.webp',
      pathname: 'visits/visit-1/photo.webp',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    })).resolves.toBeUndefined();
  });

  it('retries only the slot constraint after a concurrent insert leaves position five free', async () => {
    let attempts = 0;
    const slotConflict = Object.assign(new Error('duplicate visit photo position'), {
      code: '23505',
      constraint: 'visit_photos_visit_id_position_key',
    });
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async () => {
        attempts += 1;
        if (attempts === 1) throw slotConflict;
        return [[{ visit_id: 'visit-1', id: 'photo-position-5' }]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.attachPhoto('visit-1', 'member-1', {
      url: 'https://images.example.com/position-5.webp',
      pathname: 'visits/visit-1/position-5.webp',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    })).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });

  it('converts a retried slot collision into the canonical capacity error when all slots are full', async () => {
    let attempts = 0;
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw Object.assign(new Error('duplicate visit photo position'), {
            code: '23505',
            constraint: 'visit_photos_visit_id_position_key',
          });
        }
        return [[{ visit_id: 'visit-1', id: null }]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.attachPhoto('visit-1', 'member-1', {
      url: 'https://images.example.com/full.webp',
      pathname: 'visits/visit-1/full.webp',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    })).rejects.toThrow('A visita já possui o máximo de cinco fotos.');
    expect(attempts).toBe(2);
  });

  it('does not retry a pathname unique violation', async () => {
    let attempts = 0;
    const pathnameConflict = Object.assign(new Error('duplicate photo pathname'), {
      code: '23505',
      constraint: 'visit_photos_pathname_key',
    });
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async () => {
        attempts += 1;
        throw pathnameConflict;
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.attachPhoto('visit-1', 'member-1', {
      url: 'https://images.example.com/duplicate.webp',
      pathname: 'visits/visit-1/duplicate.webp',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    })).rejects.toBe(pathnameConflict);
    expect(attempts).toBe(1);
  });

  it('reuses the first free position after a photo is deleted', async () => {
    const sql = {
      query: async () => {
        throw new Error('Mutação executada fora da transação.');
      },
      transaction: async (factory: (transaction: { query: (text: string, params: unknown[]) => unknown }) => unknown[]) => {
        const [query] = factory({ query: (text, params) => ({ text, params }) }) as Array<{ text: string }>;
        const selectsFirstFreePosition = query.text.includes('generate_series(1, 5)');
        return [[{
          visit_id: 'visit-1',
          id: selectsFirstFreePosition ? 'replacement-photo' : null,
        }]];
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.attachPhoto('visit-1', 'member-1', {
      url: 'https://images.example.com/replacement.webp',
      pathname: 'visits/visit-1/replacement.webp',
      contentType: 'image/webp',
      sizeBytes: 100_000,
    })).resolves.toBeUndefined();
  });

  it('filters publication state in SQL so a private visit never reaches the public mapper', async () => {
    const privateRow = {
      id: 'private-visit',
      slug: 'visita-privada',
      restaurant_slug: 'restaurante-privado',
      restaurant_name: 'Restaurante Privado',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: null,
      price_band: null,
      visited_at: '2026-08-10',
      published_at: null,
      participant_count: 1,
      average_food: 10,
      average_service: 10,
      average_ambience: 10,
      average_value: 10,
      average_access: 10,
      average_wait_time: 10,
      overall: 10,
      cover_photo_url: null,
      photos: [],
      comments: [],
      legacy_review_id: null,
      legacy_payload: null,
    };
    const sql = {
      query: async (text: string) => text.includes("v.publication_state = 'published'") ? [] : [privateRow],
      transaction: async () => {
        throw new Error('Consulta pública não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.getPublicVisitBySlug('visita-privada')).resolves.toBeNull();
  });

  it('returns flat allowlisted public comments with explicit historical gaps', async () => {
    const sql = {
      query: async () => [{
        id: 'visit-1',
        slug: 'casa-teste',
        restaurant_slug: 'casa-teste',
        restaurant_name: 'Casa Teste',
        cuisine: 'Brasileira',
        neighborhood: 'Centro',
        city: 'São Paulo',
        address: 'Rua Teste, 10',
        price_band: '$$',
        visited_at: '2026-08-10',
        published_at: '2026-08-11T12:00:00.000Z',
        participant_count: 2,
        average_food: 8,
        average_service: 7,
        average_ambience: 9,
        average_value: 6,
        average_access: 5,
        average_wait_time: 8,
        overall: 7.2,
        cover_photo_url: 'https://images.example.com/cover.webp',
        photos: [{
          id: 'photo-1',
          url: 'https://images.example.com/cover.webp',
          position: 1,
          pathname: 'privado/cover.webp',
        }],
        comments: [{
          id: 'score-1',
          memberId: 'member-1',
          displayName: 'Membro 1',
          avatarUrl: null,
          comment: 'Comentário público.',
          food: 10,
          service: 10,
          ambience: 10,
          value: 10,
          access: 10,
          waitTime: 10,
          member: {
            slug: 'membro-1',
            displayName: 'Membro 1',
            avatarUrl: null,
            email: 'privado@example.com',
            auth_user_id: 'auth-privado',
          },
        }],
        legacy_review_id: 'legacy-1',
        legacy_payload: { scores: { food: 8, service: 6, ambience: 7, value: 9 } },
      }],
      transaction: async () => {
        throw new Error('Consulta pública não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const result = await repository.getPublicVisitBySlug('casa-teste');

    expect(result).toMatchObject({
      participantCount: 2,
      averages: { food: 8, service: 7, ambience: 9, value: 6, access: 5, waitTime: 8 },
      overall: 7.2,
      historical: {
        legacyReviewId: 'legacy-1',
        scores: { food: 8, service: 6, ambience: 7, value: 9, access: null, waitTime: null },
        overall: 7.5,
      },
    });
    expect(result).not.toHaveProperty('scorecards');
    expect(result?.comments[0]).toEqual({
      memberId: 'member-1',
      displayName: 'Membro 1',
      avatarUrl: null,
      comment: 'Comentário público.',
    });
    expect(Object.keys(result!.comments[0]).sort()).toEqual([
      'avatarUrl',
      'comment',
      'displayName',
      'memberId',
    ]);
    expect(result?.photos[0]).toEqual({
      id: 'photo-1',
      url: 'https://images.example.com/cover.webp',
      position: 1,
    });
  });

  it('lists only published visits matching normalized public filters', async () => {
    const row = {
      id: 'visit-1',
      slug: 'casa-teste',
      restaurant_slug: 'casa-teste',
      restaurant_name: 'Casa Teste',
      cuisine: 'Brasileira',
      neighborhood: 'Centro',
      city: 'São Paulo',
      address: null,
      price_band: '$$',
      visited_at: '2026-08-10',
      published_at: '2026-08-11T12:00:00.000Z',
      participant_count: 6,
      average_food: 8,
      average_service: 7,
      average_ambience: 9,
      average_value: 6,
      average_access: 5,
      average_wait_time: 8,
      overall: 7.2,
      cover_photo_url: null,
    };
    const sql = {
      query: async (text: string, params: unknown[]) => (
        text.includes("v.publication_state = 'published'")
        && JSON.stringify(params) === JSON.stringify(['Casa', 'Brasileira', 'Centro'])
      ) ? [row] : [],
      transaction: async () => {
        throw new Error('Consulta pública não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const result = await repository.listPublicVisits({
      busca: 'Casa',
      culinaria: 'Brasileira',
      bairro: 'Centro',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      slug: 'casa-teste',
      participantCount: 6,
      overall: 7.2,
    });
  });

  it('lists public member profiles without email or authentication identifiers', async () => {
    const sql = {
      query: async () => [{
        slug: 'membro-1',
        display_name: 'Membro 1',
        avatar_url: null,
        society_title: 'Fundador',
        member_number: 1,
        bio: 'Gosta de testar restaurantes.',
        favorite_cuisine: 'Brasileira',
        published_visits: 4,
        scorecard_count: 7,
        email: 'privado@example.com',
        auth_user_id: 'auth-privado',
      }],
      transaction: async () => {
        throw new Error('Consulta pública não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    const [result] = await repository.listPublicMembers();

    expect(result).toEqual({
      slug: 'membro-1',
      displayName: 'Membro 1',
      avatarUrl: null,
      societyTitle: 'Fundador',
      memberNumber: 1,
      bio: 'Gosta de testar restaurantes.',
      favoriteCuisine: 'Brasileira',
      contributions: { publishedVisits: 4, scorecards: 7 },
    });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('authUserId');
  });

  it('lists visits still missing the requested member scorecard', async () => {
    const sql = {
      query: async (_text: string, params: unknown[]) => params[0] === 'member-1' ? [{
        id: 'visit-1',
        slug: 'casa-teste',
        restaurant_name: 'Casa Teste',
        visited_at: '2026-08-10',
        participant_count: 5,
        quorum: 6,
        publication_state: 'private',
        has_submitted: false,
      }] : [],
      transaction: async () => {
        throw new Error('Consulta de pendências não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.listPendingVisitsForMember('member-1')).resolves.toEqual([{
      id: 'visit-1',
      slug: 'casa-teste',
      restaurantName: 'Casa Teste',
      visitedAt: '2026-08-10',
      participantCount: 5,
      quorum: 6,
      hasSubmitted: false,
      publicationState: 'private',
    }]);
  });

  it('lists private visits below quorum and projects the member submission state', async () => {
    let capturedSql = '';
    const sql = {
      query: async (text: string, params: unknown[]) => {
        capturedSql = text;
        return params[0] === 'member-1' ? [{
          id: 'visit-formation-1',
          slug: 'casa-em-formacao',
          restaurant_name: 'Casa em Formação',
          visited_at: '2026-08-11',
          participant_count: 4,
          quorum: 6,
          publication_state: 'private',
          has_submitted: true,
        }, {
          id: 'visit-formation-2',
          slug: 'mesa-sem-contribuicao',
          restaurant_name: 'Mesa sem Contribuição',
          visited_at: '2026-08-10',
          participant_count: 2,
          quorum: 6,
          publication_state: 'private',
          has_submitted: false,
        }] : [];
      },
      transaction: async () => {
        throw new Error('Consulta de formação não deve abrir transação.');
      },
    } as unknown as ReviewSqlClient;
    const repository = createNeonReviewRepository(sql);

    await expect(repository.listVisitsInFormationForMember('member-1')).resolves.toEqual([
      {
        id: 'visit-formation-1',
        slug: 'casa-em-formacao',
        restaurantName: 'Casa em Formação',
        visitedAt: '2026-08-11',
        participantCount: 4,
        quorum: 6,
        hasSubmitted: true,
        publicationState: 'private',
      },
      {
        id: 'visit-formation-2',
        slug: 'mesa-sem-contribuicao',
        restaurantName: 'Mesa sem Contribuição',
        visitedAt: '2026-08-10',
        participantCount: 2,
        quorum: 6,
        hasSubmitted: false,
        publicationState: 'private',
      },
    ]);
    expect(capturedSql).toContain("v.publication_state = 'private'");
    expect(capturedSql).toMatch(/HAVING COUNT\(s\.id\) < v\.quorum/);
    expect(capturedSql).toContain('COALESCE(BOOL_OR(own.member_id = $1), FALSE)');
    expect(capturedSql).not.toContain('NOT EXISTS');
  });
});

const integrationUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = integrationUrl ? describe : describe.skip;
const constrainedScoreColumns = [
  'food',
  'service',
  'ambience',
  'value',
  'access',
  'wait_time',
] as const;

describeIntegration('NeonReviewRepository database constraints', () => {
  const sql = integrationUrl ? neon(integrationUrl) : null;
  const memberId = randomUUID();
  const restaurantId = randomUUID();
  const visitId = randomUUID();
  const atomicMemberId = randomUUID();
  const atomicRestaurantId = randomUUID();
  const atomicVisitId = randomUUID();
  const photoMemberId = randomUUID();
  const photoRestaurantId = randomUUID();
  const photoVisitId = randomUUID();
  const photoRaceMemberId = randomUUID();
  const photoRaceRestaurantId = randomUUID();
  const photoRaceVisitWithThreeId = randomUUID();
  const photoRaceVisitWithFourId = randomUUID();
  const concurrentMemberA = randomUUID();
  const concurrentMemberB = randomUUID();
  const concurrentRestaurantId = randomUUID();
  const concurrentVisitId = randomUUID();

  beforeAll(async () => {
    if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
    const suffix = memberId.slice(0, 8);
    await sql.transaction((transaction) => [
      transaction.query(
        `INSERT INTO members
          (id, auth_user_id, email, slug, display_name, member_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [memberId, `test-auth-${suffix}`, `test-${suffix}@example.com`, `test-member-${suffix}`, 'Teste', 8],
      ),
      transaction.query(
        `INSERT INTO restaurants (id, slug, name, cuisine, neighborhood)
         VALUES ($1, $2, $3, $4, $5)`,
        [restaurantId, `test-restaurant-${suffix}`, 'Restaurante Teste', 'Teste', 'Teste'],
      ),
      transaction.query(
        `INSERT INTO visits (id, slug, restaurant_id, created_by, visited_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [visitId, `test-visit-${suffix}`, restaurantId, memberId, '2026-08-11'],
      ),
      transaction.query(
        `INSERT INTO scorecards
          (visit_id, member_id, food, service, ambience, value, access, wait_time, comment)
         VALUES ($1, $2, 0, 2, 4, 6, 8, 10, $3)`,
        [visitId, memberId, 'Primeira ficha'],
      ),
    ]);
  });

  it('enforces one scorecard per member and visit', async () => {
    if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
    await expect(sql.query(
      `INSERT INTO scorecards
        (visit_id, member_id, food, service, ambience, value, access, wait_time, comment)
       VALUES ($1, $2, 1, 1, 1, 1, 1, 1, $3)`,
      [visitId, memberId, 'Duplicada'],
    )).rejects.toThrow();
  });

  it.each(constrainedScoreColumns.flatMap((column) => [-1, 11].map((score) => ({ column, score }))))(
    'rejects $score for the constrained score column $column',
    async ({ column, score }) => {
      if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
      await expect(sql.query(
        `UPDATE scorecards SET ${column} = $1 WHERE visit_id = $2 AND member_id = $3`,
        [score, visitId, memberId],
      )).rejects.toThrow();
    },
  );

  it('keeps the SQL quorum transition equivalent to the domain rule for the first score', async () => {
    if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
    const suffix = atomicMemberId.slice(0, 8);
    await sql.transaction((transaction) => [
      transaction.query(
        `INSERT INTO members
          (id, auth_user_id, email, slug, display_name, member_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          atomicMemberId,
          `atomic-auth-${suffix}`,
          `atomic-${suffix}@example.com`,
          `atomic-member-${suffix}`,
          'Teste Atômico',
          7,
        ],
      ),
      transaction.query(
        `INSERT INTO restaurants (id, slug, name, cuisine, neighborhood)
         VALUES ($1, $2, $3, $4, $5)`,
        [atomicRestaurantId, `atomic-restaurant-${suffix}`, 'Atômico', 'Teste', 'Teste'],
      ),
      transaction.query(
        `INSERT INTO visits (id, slug, restaurant_id, created_by, visited_at, quorum)
         VALUES ($1, $2, $3, $4, $5, 1)`,
        [atomicVisitId, `atomic-visit-${suffix}`, atomicRestaurantId, atomicMemberId, '2026-08-11'],
      ),
    ]);
    const repository = createNeonReviewRepository(sql);

    const result = await repository.submitScorecardAtomically({
      visitId: atomicVisitId,
      memberId: atomicMemberId,
      scorecard,
      expectedPublicationState: 'private',
      quorum: 1,
      transitionAtQuorum: { state: 'published', reason: 'quorum' },
    });

    expect(result).toMatchObject({
      publicationState: 'published',
      publicationReason: 'quorum',
      participantCount: 1,
      aggregate: {
        participantCount: 1,
        averages: { food: 8, service: 7, ambience: 9, value: 6, access: 5, waitTime: 4 },
        overall: 6.5,
      },
      publicationChanged: true,
    });

    const updated = await repository.submitScorecardAtomically({
      visitId: atomicVisitId,
      memberId: atomicMemberId,
      scorecard: {
        ...scorecard,
        food: 2,
        service: 3,
        ambience: 4,
        value: 5,
        access: 6,
        waitTime: 7,
      },
      expectedPublicationState: 'published',
      quorum: 1,
      transitionAtQuorum: { state: 'published', reason: 'quorum' },
    });

    expect(updated).toMatchObject({
      publicationState: 'published',
      participantCount: 1,
      aggregate: {
        participantCount: 1,
        averages: { food: 2, service: 3, ambience: 4, value: 5, access: 6, waitTime: 7 },
        overall: 4.5,
      },
      publicationChanged: false,
    });
    const events = await sql.query(
      `SELECT COUNT(*)::int AS event_count
       FROM publication_events
       WHERE visit_id = $1 AND action = 'quorum_publish'`,
      [atomicVisitId],
    );
    expect(Number(events[0]?.event_count)).toBe(1);
  });

  it('reuses a deleted photo position without exceeding five photos', async () => {
    if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
    const suffix = photoMemberId.slice(0, 8);
    await sql.transaction((transaction) => [
      transaction.query(
        `INSERT INTO members
          (id, auth_user_id, email, slug, display_name, member_number)
         VALUES ($1, $2, $3, $4, $5, 6)`,
        [
          photoMemberId,
          `photo-auth-${suffix}`,
          `photo-${suffix}@example.com`,
          `photo-member-${suffix}`,
          'Teste Foto',
        ],
      ),
      transaction.query(
        `INSERT INTO restaurants (id, slug, name, cuisine, neighborhood)
         VALUES ($1, $2, $3, $4, $5)`,
        [photoRestaurantId, `photo-restaurant-${suffix}`, 'Fotos', 'Teste', 'Teste'],
      ),
      transaction.query(
        `INSERT INTO visits (id, slug, restaurant_id, created_by, visited_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [photoVisitId, `photo-visit-${suffix}`, photoRestaurantId, photoMemberId, '2026-08-11'],
      ),
    ]);
    const repository = createNeonReviewRepository(sql);
    for (let position = 1; position <= 5; position += 1) {
      await repository.attachPhoto(photoVisitId, photoMemberId, {
        url: `https://images.example.com/${position}.webp`,
        pathname: `test/${photoVisitId}/${position}.webp`,
        contentType: 'image/webp',
        sizeBytes: 100_000,
      });
    }
    const [deleted] = await sql.query(
      'SELECT id FROM visit_photos WHERE visit_id = $1 AND position = 2',
      [photoVisitId],
    );
    await repository.deletePhoto(photoVisitId, String(deleted.id), photoMemberId);
    await repository.attachPhoto(photoVisitId, photoMemberId, {
      url: 'https://images.example.com/replacement.webp',
      pathname: `test/${photoVisitId}/replacement.webp`,
      contentType: 'image/webp',
      sizeBytes: 100_000,
    });

    const positions = await sql.query(
      'SELECT position, pathname FROM visit_photos WHERE visit_id = $1 ORDER BY position',
      [photoVisitId],
    );
    expect(positions).toHaveLength(5);
    expect(positions[1]).toMatchObject({ position: 2, pathname: `test/${photoVisitId}/replacement.webp` });
  });

  it('allocates concurrent fourth/fifth slots and turns the sixth attempt into capacity', async () => {
    if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
    const suffix = photoRaceMemberId.slice(0, 8);
    await sql.transaction((transaction) => [
      transaction.query(
        `INSERT INTO members
          (id, auth_user_id, email, slug, display_name, member_number)
         VALUES ($1, $2, $3, $4, $5, 3)`,
        [
          photoRaceMemberId,
          `photo-race-auth-${suffix}`,
          `photo-race-${suffix}@example.com`,
          `photo-race-member-${suffix}`,
          'Teste Corrida de Fotos',
        ],
      ),
      transaction.query(
        `INSERT INTO restaurants (id, slug, name, cuisine, neighborhood)
         VALUES ($1, $2, $3, $4, $5)`,
        [photoRaceRestaurantId, `photo-race-restaurant-${suffix}`, 'Fotos Concorrentes', 'Teste', 'Teste'],
      ),
      transaction.query(
        `INSERT INTO visits (id, slug, restaurant_id, created_by, visited_at)
         VALUES ($1, $2, $3, $4, $5), ($6, $7, $3, $4, $5)`,
        [
          photoRaceVisitWithThreeId,
          `photo-race-three-${suffix}`,
          photoRaceRestaurantId,
          photoRaceMemberId,
          '2026-08-11',
          photoRaceVisitWithFourId,
          `photo-race-four-${suffix}`,
        ],
      ),
      transaction.query(
        `INSERT INTO visit_photos
          (visit_id, uploaded_by, url, pathname, content_type, size_bytes, position)
         SELECT $1, $2, 'https://images.example.com/three-' || position || '.webp',
                'test/' || $1 || '/three-' || position || '.webp', 'image/webp', 100000, position
         FROM generate_series(1, 3) AS position`,
        [photoRaceVisitWithThreeId, photoRaceMemberId],
      ),
      transaction.query(
        `INSERT INTO visit_photos
          (visit_id, uploaded_by, url, pathname, content_type, size_bytes, position)
         SELECT $1, $2, 'https://images.example.com/four-' || position || '.webp',
                'test/' || $1 || '/four-' || position || '.webp', 'image/webp', 100000, position
         FROM generate_series(1, 4) AS position`,
        [photoRaceVisitWithFourId, photoRaceMemberId],
      ),
    ]);
    const repository = createNeonReviewRepository(sql);

    const fromThree = await Promise.allSettled(['a', 'b'].map((suffixName) => (
      repository.attachPhoto(photoRaceVisitWithThreeId, photoRaceMemberId, {
        url: `https://images.example.com/from-three-${suffixName}.webp`,
        pathname: `test/${photoRaceVisitWithThreeId}/from-three-${suffixName}.webp`,
        contentType: 'image/webp',
        sizeBytes: 100_000,
      })
    )));
    expect(fromThree.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);

    const fromFour = await Promise.allSettled(['a', 'b'].map((suffixName) => (
      repository.attachPhoto(photoRaceVisitWithFourId, photoRaceMemberId, {
        url: `https://images.example.com/from-four-${suffixName}.webp`,
        pathname: `test/${photoRaceVisitWithFourId}/from-four-${suffixName}.webp`,
        contentType: 'image/webp',
        sizeBytes: 100_000,
      })
    )));
    expect(fromFour.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = fromFour.find((result) => result.status === 'rejected');
    expect(rejected).toMatchObject({
      status: 'rejected',
      reason: expect.objectContaining({
        message: 'A visita já possui o máximo de cinco fotos.',
      }),
    });

    const counts = await sql.query(
      `SELECT visit_id, COUNT(*)::int AS photo_count
       FROM visit_photos
       WHERE visit_id IN ($1, $2)
       GROUP BY visit_id`,
      [photoRaceVisitWithThreeId, photoRaceVisitWithFourId],
    );
    expect(counts.map((row) => Number(row.photo_count)).sort()).toEqual([5, 5]);
  });

  it('retries concurrent scorecards and records a single quorum event', async () => {
    if (!sql) throw new Error('TEST_DATABASE_URL ausente.');
    const suffix = concurrentVisitId.slice(0, 8);
    await sql.transaction((transaction) => [
      transaction.query(
        `INSERT INTO members
          (id, auth_user_id, email, slug, display_name, member_number)
         VALUES ($1, $2, $3, $4, $5, 4), ($6, $7, $8, $9, $10, 5)`,
        [
          concurrentMemberA,
          `concurrent-auth-a-${suffix}`,
          `concurrent-a-${suffix}@example.com`,
          `concurrent-member-a-${suffix}`,
          'Concorrente A',
          concurrentMemberB,
          `concurrent-auth-b-${suffix}`,
          `concurrent-b-${suffix}@example.com`,
          `concurrent-member-b-${suffix}`,
          'Concorrente B',
        ],
      ),
      transaction.query(
        `INSERT INTO restaurants (id, slug, name, cuisine, neighborhood)
         VALUES ($1, $2, $3, $4, $5)`,
        [concurrentRestaurantId, `concurrent-restaurant-${suffix}`, 'Concorrente', 'Teste', 'Teste'],
      ),
      transaction.query(
        `INSERT INTO visits (id, slug, restaurant_id, created_by, visited_at, quorum)
         VALUES ($1, $2, $3, $4, $5, 2)`,
        [concurrentVisitId, `concurrent-visit-${suffix}`, concurrentRestaurantId, concurrentMemberA, '2026-08-11'],
      ),
    ]);
    const repository = createNeonReviewRepository(sql);

    await Promise.all([
      repository.submitScorecardAtomically({
        visitId: concurrentVisitId,
        memberId: concurrentMemberA,
        scorecard,
        expectedPublicationState: 'private',
        quorum: 2,
        transitionAtQuorum: { state: 'published', reason: 'quorum' },
      }),
      repository.submitScorecardAtomically({
        visitId: concurrentVisitId,
        memberId: concurrentMemberB,
        scorecard,
        expectedPublicationState: 'private',
        quorum: 2,
        transitionAtQuorum: { state: 'published', reason: 'quorum' },
      }),
    ]);

    const [result] = await sql.query(
      `SELECT
         v.publication_state,
         COUNT(DISTINCT s.id)::int AS participant_count,
         COUNT(DISTINCT e.id)::int AS event_count
       FROM visits v
       LEFT JOIN scorecards s ON s.visit_id = v.id
       LEFT JOIN publication_events e ON e.visit_id = v.id AND e.action = 'quorum_publish'
       WHERE v.id = $1
       GROUP BY v.id`,
      [concurrentVisitId],
    );
    expect(result).toMatchObject({
      publication_state: 'published',
      participant_count: 2,
      event_count: 1,
    });
  });

  afterAll(async () => {
    if (!sql) return;
    await sql.transaction((transaction) => [
      transaction.query('DELETE FROM visits WHERE id = $1', [visitId]),
      transaction.query('DELETE FROM visits WHERE id = $1', [atomicVisitId]),
      transaction.query('DELETE FROM visits WHERE id = $1', [photoVisitId]),
      transaction.query('DELETE FROM visits WHERE id = $1', [photoRaceVisitWithThreeId]),
      transaction.query('DELETE FROM visits WHERE id = $1', [photoRaceVisitWithFourId]),
      transaction.query('DELETE FROM visits WHERE id = $1', [concurrentVisitId]),
      transaction.query('DELETE FROM restaurants WHERE id = $1', [restaurantId]),
      transaction.query('DELETE FROM restaurants WHERE id = $1', [atomicRestaurantId]),
      transaction.query('DELETE FROM restaurants WHERE id = $1', [photoRestaurantId]),
      transaction.query('DELETE FROM restaurants WHERE id = $1', [photoRaceRestaurantId]),
      transaction.query('DELETE FROM restaurants WHERE id = $1', [concurrentRestaurantId]),
      transaction.query('DELETE FROM members WHERE id = $1', [memberId]),
      transaction.query('DELETE FROM members WHERE id = $1', [atomicMemberId]),
      transaction.query('DELETE FROM members WHERE id = $1', [photoMemberId]),
      transaction.query('DELETE FROM members WHERE id = $1', [photoRaceMemberId]),
      transaction.query('DELETE FROM members WHERE id = $1', [concurrentMemberA]),
      transaction.query('DELETE FROM members WHERE id = $1', [concurrentMemberB]),
    ]);
  });
});
