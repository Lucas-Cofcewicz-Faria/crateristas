import { describe, expect, it } from 'vitest';
import type { MemberRecord, VisitDeletionTarget } from '@/domain/reviews/repository';
import {
  createVisitDeletionRouteHandlers,
  type VisitDeletionRouteDependencies,
} from './route';

const visitId = '8f3f44cf-2db1-4c46-a0b0-94f29cb8f26a';
const target: VisitDeletionTarget = {
  id: visitId,
  restaurantId: '78002c78-3e2e-4899-a108-0a70d2281675',
  participantCount: 3,
  photoPathnames: [
    `visits/${visitId}/mesa-a-AbCd12.webp`,
    `visits/${visitId}/mesa-b-EfGh34.webp`,
  ],
};

function member(role: MemberRecord['role']): MemberRecord {
  return {
    id: role === 'admin'
      ? '1bf772d2-2b40-4f5d-8db7-e05dfbb904f1'
      : '75cdbdf1-5320-4d7c-89f8-91a3fa11b1bb',
    authUserId: `auth-${role}`,
    email: `${role}@example.com`,
    slug: role,
    displayName: role === 'admin' ? 'Administrador' : 'Craterista',
    avatarUrl: null,
    societyTitle: null,
    memberNumber: role === 'admin' ? 1 : 2,
    bio: '',
    favoriteCuisine: null,
    role,
  };
}

function deletionRequest(confirmation: string, expectedParticipantCount = 3): Request {
  return new Request(`http://localhost/api/visits/${visitId}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirmation, expectedParticipantCount }),
  });
}

function makeHarness(actor = member('admin')) {
  let databasePresent = true;
  const blobPathnames = new Set(target.photoPathnames);
  let failBlob = false;
  let failDatabaseOnce = false;
  let refuseDatabaseDeletion = false;
  let deletionStarted = false;
  const dependencies: VisitDeletionRouteDependencies = {
    requireMember: async () => actor,
    prepareVisitDeletion: async (currentActor, id, expectedParticipantCount) => {
      if (currentActor.role !== 'admin') {
        const error = new Error('Apenas o administrador pode excluir uma review.');
        error.name = 'VisitDeletionAuthorizationError';
        throw error;
      }
      if (!databasePresent || id !== visitId) return null;
      if (expectedParticipantCount !== target.participantCount) {
        const error = new Error('A quantidade de avaliações mudou.');
        error.name = 'VisitDeletionConflictError';
        throw error;
      }
      deletionStarted = true;
      return target;
    },
    deleteVisit: async (currentActor, id) => {
      if (currentActor.role !== 'admin' || id !== visitId || !databasePresent) return false;
      if (refuseDatabaseDeletion) return false;
      if (failDatabaseOnce) {
        failDatabaseOnce = false;
        throw new Error('Banco temporariamente indisponível');
      }
      databasePresent = false;
      return true;
    },
    del: async (pathnames) => {
      if (failBlob) throw new Error('Blob temporariamente indisponível');
      for (const pathname of Array.isArray(pathnames) ? pathnames : [pathnames]) {
        blobPathnames.delete(pathname);
      }
    },
  };
  return {
    handlers: createVisitDeletionRouteHandlers(async () => dependencies),
    databaseIsPresent: () => databasePresent,
    isPubliclyVisible: () => databasePresent && !deletionStarted,
    blobPathnames: () => [...blobPathnames],
    failBlob: () => { failBlob = true; },
    failDatabaseOnce: () => { failDatabaseOnce = true; },
    refuseDatabaseDeletion: () => { refuseDatabaseDeletion = true; },
  };
}

describe('DELETE /api/visits/[id]', () => {
  it('exige a frase exata antes de consultar ou apagar qualquer dado', async () => {
    const harness = makeHarness();

    const response = await harness.handlers.DELETE(
      deletionRequest('deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(400);
    expect(harness.databaseIsPresent()).toBe(true);
    expect(harness.blobPathnames()).toEqual(target.photoPathnames);
  });

  it('não inicia a exclusão quando a quantidade mostrada no diálogo ficou desatualizada', async () => {
    const harness = makeHarness();

    const response = await harness.handlers.DELETE(
      deletionRequest('Deletar review', 2),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(409);
    expect(harness.databaseIsPresent()).toBe(true);
    expect(harness.isPubliclyVisible()).toBe(true);
    expect(harness.blobPathnames()).toEqual(target.photoPathnames);
  });

  it('rejeita identificador inválido sem transformar erro do cliente em 500', async () => {
    const harness = makeHarness();

    const response = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: '../review' }) },
    );

    expect(response.status).toBe(400);
    expect(harness.databaseIsPresent()).toBe(true);
  });

  it('recusa membro comum mesmo quando ele criou ou avaliou a visita', async () => {
    const harness = makeHarness(member('member'));

    const response = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(403);
    expect(harness.databaseIsPresent()).toBe(true);
    expect(harness.blobPathnames()).toEqual(target.photoPathnames);
  });

  it('remove todos os Blobs antes de apagar a review e suas avaliações do banco', async () => {
    const harness = makeHarness();

    const response = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(204);
    expect(harness.blobPathnames()).toEqual([]);
    expect(harness.databaseIsPresent()).toBe(false);
  });

  it('preserva o banco para retry quando a limpeza do Blob falha', async () => {
    const harness = makeHarness();
    harness.failBlob();

    const response = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(500);
    expect(harness.databaseIsPresent()).toBe(true);
    expect(harness.isPubliclyVisible()).toBe(false);
    expect(harness.blobPathnames()).toEqual(target.photoPathnames);
  });

  it('não anuncia sucesso quando o banco recusa apagar um alvo que mudou durante a limpeza', async () => {
    const harness = makeHarness();
    harness.refuseDatabaseDeletion();

    const response = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(response.status).toBe(409);
    expect(harness.databaseIsPresent()).toBe(true);
  });

  it('permite repetir depois de falha do banco sem recriar os Blobs já removidos', async () => {
    const harness = makeHarness();
    harness.failDatabaseOnce();

    const failed = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );
    const retried = await harness.handlers.DELETE(
      deletionRequest('Deletar review'),
      { params: Promise.resolve({ id: visitId }) },
    );

    expect(failed.status).toBe(500);
    expect(retried.status).toBe(204);
    expect(harness.blobPathnames()).toEqual([]);
    expect(harness.databaseIsPresent()).toBe(false);
  });
});
