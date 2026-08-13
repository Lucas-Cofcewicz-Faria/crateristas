import { describe, expect, it } from 'vitest';
import { aggregateScorecards } from './aggregate';
import type {
  AtomicPublicationChangeInput,
  AtomicScorecardSubmissionInput,
  MemberRecord,
  PendingVisit,
  PhotoInput,
  PhotoRecord,
  PublicationEventInput,
  PublicMemberSummary,
  PublicVisitDetail,
  PublicVisitSummary,
  ReviewRepository,
  ScorecardRecord,
  SubmissionResult,
  VisitRecord,
} from './repository';
import { createReviewService } from './service';
import type { CreateVisitInput, ScorecardInput } from './schemas';
import type { PublicationReason, PublicationState, PublicVisitFilters } from './types';

const visitId = 'visit-1';
const validScorecard: ScorecardInput = {
  food: 8,
  service: 8,
  ambience: 8,
  value: 8,
  access: 8,
  waitTime: 8,
  comment: 'Voltaria sem pensar duas vezes.',
};
const validVisit: CreateVisitInput = {
  restaurantName: 'Casa Teste',
  cuisine: 'Brasileira',
  neighborhood: 'Centro',
  city: 'São Paulo',
  visitedAt: '2026-08-10',
};
const validPhoto: PhotoInput = {
  url: 'https://images.example.com/photo.webp',
  pathname: 'visits/visit-1/photo.webp',
  contentType: 'image/webp',
  sizeBytes: 120_000,
};

function member(id: string, role: MemberRecord['role'] = 'member'): MemberRecord {
  const number = Number(id.replace(/\D/g, '')) || 1;
  return {
    id,
    authUserId: `auth-${id}`,
    email: `${id}@example.com`,
    slug: id,
    displayName: `Membro ${number}`,
    avatarUrl: null,
    societyTitle: null,
    memberNumber: number,
    bio: '',
    favoriteCuisine: null,
    role,
  };
}

const members = Array.from({ length: 8 }, (_, index) => member(`member-${index + 1}`));

class InMemoryReviewRepository implements ReviewRepository {
  readonly memberRecords = new Map(members.map((record) => [record.id, record]));
  readonly scorecards = new Map<string, ScorecardRecord>();
  readonly events: PublicationEventInput[] = [];
  readonly photos = new Map<string, PhotoRecord>();
  visit: VisitRecord = {
    id: visitId,
    slug: 'casa-teste',
    restaurantId: 'restaurant-1',
    createdBy: members[0].id,
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

  async findMemberByAuthUserId(authUserId: string) {
    return [...this.memberRecords.values()].find((record) => record.authUserId === authUserId) ?? null;
  }

  async findMemberById(memberId: string) {
    return this.memberRecords.get(memberId) ?? null;
  }

  async findVisitById(id: string) {
    return id === this.visit.id ? { ...this.visit } : null;
  }

  async createVisit(actorId: string, input: CreateVisitInput) {
    this.visit = {
      ...this.visit,
      createdBy: actorId,
      visitedAt: input.visitedAt,
    };
    return { ...this.visit };
  }

  async upsertScorecard(id: string, memberId: string, input: ScorecardInput) {
    this.scorecards.set(`${id}:${memberId}`, {
      id: `score-${memberId}`,
      visitId: id,
      memberId,
      ...input,
    });
  }

  async countScorecards(id: string) {
    return [...this.scorecards.values()].filter((scorecard) => scorecard.visitId === id).length;
  }

  async updatePublication(
    id: string,
    state: PublicationState,
    reason: PublicationReason,
    actorId: string | null,
  ) {
    if (id !== this.visit.id) throw new Error('Visita não encontrada.');
    this.visit = {
      ...this.visit,
      publicationState: state,
      publicationReason: reason,
      publishedAt: state === 'published' ? '2026-08-11T12:00:00.000Z' : this.visit.publishedAt,
      publishedBy: state === 'published' ? actorId : this.visit.publishedBy,
      hiddenAt: state === 'hidden' ? '2026-08-11T12:00:00.000Z' : null,
      hiddenBy: state === 'hidden' ? actorId : null,
    };
    return { ...this.visit };
  }

  async recordPublicationEvent(input: PublicationEventInput) {
    this.events.push(input);
  }

  async submitScorecardAtomically(input: AtomicScorecardSubmissionInput): Promise<SubmissionResult> {
    await this.upsertScorecard(input.visitId, input.memberId, input.scorecard);
    const participantCount = await this.countScorecards(input.visitId);
    const aggregate = aggregateScorecards(
      [...this.scorecards.values()]
        .filter((scorecard) => scorecard.visitId === input.visitId),
    );
    const next = participantCount >= input.quorum
      ? input.transitionAtQuorum
      : { state: this.visit.publicationState, reason: this.visit.publicationReason };
    const changed = next.state !== this.visit.publicationState;
    if (changed) {
      await this.updatePublication(input.visitId, next.state, next.reason, null);
      await this.recordPublicationEvent({
        visitId: input.visitId,
        actorId: null,
        action: 'quorum_publish',
        participantCount,
      });
    }
    return {
      visitId: input.visitId,
      publicationState: this.visit.publicationState,
      publicationReason: this.visit.publicationReason,
      participantCount,
      aggregate,
      publicationChanged: changed,
    };
  }

  async changePublicationAtomically(input: AtomicPublicationChangeInput) {
    await this.updatePublication(input.visitId, input.state, input.reason, input.actorId);
    await this.recordPublicationEvent({
      visitId: input.visitId,
      actorId: input.actorId,
      action: input.action,
      participantCount: await this.countScorecards(input.visitId),
    });
    return { ...this.visit };
  }

  async attachPhoto(id: string, actorId: string, input: PhotoInput) {
    const position = (await this.countVisitPhotos(id)) + 1;
    if (position > 5) throw new Error('A visita já possui o máximo de cinco fotos.');
    this.photos.set(`photo-${position}`, {
      id: `photo-${position}`,
      visitId: id,
      uploadedBy: actorId,
      position,
      ...input,
    });
  }

  async findPhotoById(photoId: string) {
    return this.photos.get(photoId) ?? null;
  }

  async findPhotoByPathname(pathname: string) {
    return [...this.photos.values()].find((photo) => photo.pathname === pathname) ?? null;
  }

  async deletePhoto(id: string, photoId: string, actorId: string) {
    void actorId;
    const photo = this.photos.get(photoId);
    if (!photo || photo.visitId !== id) return null;
    this.photos.delete(photoId);
    return photo;
  }

  async countVisitPhotos(id: string) {
    return [...this.photos.values()].filter((photo) => photo.visitId === id).length;
  }

  async listPublicVisits(filters: PublicVisitFilters): Promise<PublicVisitSummary[]> {
    void filters;
    const detail = await this.getPublicVisitBySlug(this.visit.slug);
    return detail ? [detail] : [];
  }

  async getPublicVisitBySlug(slug: string): Promise<PublicVisitDetail | null> {
    if (slug !== this.visit.slug || this.visit.publicationState !== 'published') return null;
    const scorecards = [...this.scorecards.values()];
    const aggregate = aggregateScorecards(scorecards);
    return {
      id: this.visit.id,
      slug: this.visit.slug,
      restaurant: {
        slug: 'casa-teste',
        name: 'Casa Teste',
        cuisine: 'Brasileira',
        neighborhood: 'Centro',
        city: 'São Paulo',
        address: null,
        priceBand: null,
      },
      visitedAt: this.visit.visitedAt,
      publishedAt: this.visit.publishedAt,
      ...aggregate,
      coverPhotoUrl: null,
      photos: [],
      comments: scorecards.map((scorecard) => ({
        memberId: scorecard.memberId,
        displayName: this.memberRecords.get(scorecard.memberId)!.displayName,
        avatarUrl: this.memberRecords.get(scorecard.memberId)!.avatarUrl,
        comment: scorecard.comment,
      })),
      historical: null,
    };
  }

  async listPublicMembers(): Promise<PublicMemberSummary[]> {
    return [];
  }

  async listPendingVisitsForMember(memberId: string): Promise<PendingVisit[]> {
    void memberId;
    return [];
  }

  async listVisitsInFormationForMember(memberId: string): Promise<PendingVisit[]> {
    void memberId;
    return [];
  }
}

function repositoryWithScores(count: number) {
  const repository = new InMemoryReviewRepository();
  for (let index = 0; index < count; index += 1) {
    const current = members[index];
    repository.scorecards.set(`${visitId}:${current.id}`, {
      id: `score-${current.id}`,
      visitId,
      memberId: current.id,
      ...validScorecard,
    });
  }
  return repository;
}

describe('createReviewService', () => {
  it('creates a visit owned by the authenticated actor', async () => {
    const repository = repositoryWithScores(0);
    const service = createReviewService(repository);

    const result = await service.createVisit(members[1], validVisit);

    expect(result.createdBy).toBe(members[1].id);
    expect(result.visitedAt).toBe('2026-08-10');
  });

  it('attaches a photo only when the authenticated actor created the visit', async () => {
    const repository = repositoryWithScores(0);
    const service = createReviewService(repository);

    await service.attachPhoto(members[0], visitId, validPhoto);

    expect(repository.photos.get('photo-1')).toMatchObject({
      visitId,
      uploadedBy: members[0].id,
      position: 1,
    });
  });

  it('rejects photo attachment by a member who did not create the visit', async () => {
    const repository = repositoryWithScores(0);
    const service = createReviewService(repository);

    await expect(service.attachPhoto(members[2], visitId, validPhoto))
      .rejects.toThrow('Apenas o criador da visita ou um administrador pode gerenciar fotos.');
    expect(repository.photos.size).toBe(0);
  });

  it('authorizes an upload token only for creator/admin while capacity remains', async () => {
    const repository = repositoryWithScores(0);
    const service = createReviewService(repository);
    const admin = member('member-8', 'admin');

    await expect(service.authorizePhotoUpload(members[0], visitId)).resolves.toBeUndefined();
    await expect(service.authorizePhotoUpload(admin, visitId)).resolves.toBeUndefined();
    await expect(service.authorizePhotoUpload(members[2], visitId))
      .rejects.toThrow('Apenas o criador da visita ou um administrador pode gerenciar fotos.');
  });

  it('rejects a sixth photo without creating a position above five', async () => {
    const repository = repositoryWithScores(0);
    const service = createReviewService(repository);
    for (let index = 0; index < 5; index += 1) {
      await service.attachPhoto(members[0], visitId, {
        ...validPhoto,
        pathname: `visits/visit-1/photo-${index}.webp`,
      });
    }

    await expect(service.attachPhoto(members[0], visitId, {
      ...validPhoto,
      pathname: 'visits/visit-1/photo-6.webp',
    })).rejects.toThrow('A visita já possui o máximo de cinco fotos.');
    expect(repository.photos.size).toBe(5);
  });

  it('rejects photo removal by an unrelated member even when that member uploaded it', async () => {
    const repository = repositoryWithScores(0);
    await repository.attachPhoto(visitId, members[1].id, validPhoto);
    const service = createReviewService(repository);

    await expect(service.removePhoto(members[1], visitId, 'photo-1'))
      .rejects.toThrow('Apenas o criador da visita ou um administrador pode gerenciar fotos.');
    expect(repository.photos.has('photo-1')).toBe(true);
  });

  it('allows the visit creator and an admin to remove photos', async () => {
    const repository = repositoryWithScores(0);
    await repository.attachPhoto(visitId, members[1].id, validPhoto);
    await repository.attachPhoto(visitId, members[2].id, {
      ...validPhoto,
      pathname: 'visits/visit-1/photo-2.webp',
    });
    const admin = member('member-8', 'admin');
    const service = createReviewService(repository);

    await service.removePhoto(members[0], visitId, 'photo-1');
    await service.removePhoto(admin, visitId, 'photo-2');

    expect(repository.photos.size).toBe(0);
  });

  it('returns the trusted pathname before deletion and makes metadata removal idempotent', async () => {
    const repository = repositoryWithScores(0);
    await repository.attachPhoto(visitId, members[0].id, validPhoto);
    const service = createReviewService(repository);

    await expect(service.preparePhotoRemoval(members[0], visitId, 'photo-1'))
      .resolves.toMatchObject({ pathname: validPhoto.pathname });
    await expect(service.removePhoto(members[0], visitId, 'photo-1'))
      .resolves.toMatchObject({ pathname: validPhoto.pathname });
    await expect(service.removePhoto(members[0], visitId, 'photo-1'))
      .resolves.toBeNull();
  });

  it('publishes the sixth scorecard and keeps individual scores private', async () => {
    const repository = repositoryWithScores(5);
    const service = createReviewService(repository);

    const result = await service.submitScorecard(members[5], visitId, validScorecard);

    expect(result).toMatchObject({
      publicationState: 'published',
      participantCount: 6,
      aggregate: {
        participantCount: 6,
        averages: { food: 8, service: 8, ambience: 8, value: 8, access: 8, waitTime: 8 },
        overall: 8,
      },
    });
    const publicVisit = await repository.getPublicVisitBySlug('casa-teste');
    expect(publicVisit).not.toHaveProperty('scorecards');
    expect(publicVisit?.comments[0]).not.toHaveProperty('food');
    expect(repository.events).toHaveLength(1);
  });

  it('edits only the actor scorecard without increasing the participant count', async () => {
    const repository = repositoryWithScores(6);
    repository.visit.publicationState = 'published';
    repository.visit.publicationReason = 'quorum';
    const service = createReviewService(repository);

    const result = await service.submitScorecard(members[0], visitId, {
      ...validScorecard,
      food: 3,
      comment: 'Mudei de opinião depois da sobremesa.',
    });

    expect(result).toMatchObject({
      participantCount: 6,
      aggregate: {
        participantCount: 6,
        averages: { food: 7.2, service: 8, ambience: 8, value: 8, access: 8, waitTime: 8 },
        overall: 7.9,
      },
    });
    expect(repository.scorecards.get(`${visitId}:${members[0].id}`)).toMatchObject({
      memberId: members[0].id,
      food: 3,
    });
    expect(repository.events).toHaveLength(0);
  });

  it('keeps a published visit online while the seventh and eighth scorecards recalculate it', async () => {
    const repository = repositoryWithScores(6);
    repository.visit.publicationState = 'published';
    repository.visit.publicationReason = 'quorum';
    const service = createReviewService(repository);

    const seventh = await service.submitScorecard(members[6], visitId, {
      ...validScorecard,
      food: 2,
    });
    const eighth = await service.submitScorecard(members[7], visitId, {
      ...validScorecard,
      food: 10,
    });

    expect(seventh).toMatchObject({
      publicationState: 'published',
      participantCount: 7,
      aggregate: {
        participantCount: 7,
        averages: { food: 7.1, service: 8, ambience: 8, value: 8, access: 8, waitTime: 8 },
        overall: 7.9,
      },
    });
    expect(eighth).toMatchObject({
      publicationState: 'published',
      participantCount: 8,
      aggregate: {
        participantCount: 8,
        averages: { food: 7.5, service: 8, ambience: 8, value: 8, access: 8, waitTime: 8 },
        overall: 7.9,
      },
    });
    expect(repository.events).toHaveLength(0);
  });

  it('does not auto-republish a hidden visit when another scorecard is submitted', async () => {
    const repository = repositoryWithScores(6);
    repository.visit.publicationState = 'hidden';
    repository.visit.publicationReason = null;
    const service = createReviewService(repository);

    const result = await service.submitScorecard(members[6], visitId, validScorecard);

    expect(result).toMatchObject({ publicationState: 'hidden', participantCount: 7 });
    expect(repository.events).toHaveLength(0);
  });

  it('ignores an arbitrary memberId in the payload and always edits the actor scorecard', async () => {
    const repository = repositoryWithScores(2);
    const service = createReviewService(repository);

    await service.submitScorecard(members[1], visitId, {
      ...validScorecard,
      food: 1,
      memberId: members[0].id,
    } as ScorecardInput);

    expect(repository.scorecards.get(`${visitId}:${members[1].id}`)?.food).toBe(1);
    expect(repository.scorecards.get(`${visitId}:${members[0].id}`)?.food).toBe(8);
  });

  it('rejects early publication by a non-admin before mutating the visit', async () => {
    const repository = repositoryWithScores(1);
    const service = createReviewService(repository);

    await expect(service.changePublication(members[0], visitId, 'publish_early'))
      .rejects.toThrow('Apenas administradores podem alterar a publicação.');
    expect(repository.visit.publicationState).toBe('private');
    expect(repository.events).toHaveLength(0);
  });

  it('lets an admin publish early after one scorecard and records one event', async () => {
    const repository = repositoryWithScores(1);
    const admin = member('member-8', 'admin');
    repository.memberRecords.set(admin.id, admin);
    const service = createReviewService(repository);

    const result = await service.changePublication(admin, visitId, 'publish_early');

    expect(result).toMatchObject({
      publicationState: 'published',
      publicationReason: 'admin_override',
      publishedBy: admin.id,
    });
    expect(repository.events).toEqual([{
      visitId,
      actorId: admin.id,
      action: 'publish_early',
      participantCount: 1,
    }]);
  });

  it('lets an admin hide and republish while recording events only for state changes', async () => {
    const repository = repositoryWithScores(6);
    repository.visit.publicationState = 'published';
    repository.visit.publicationReason = 'quorum';
    const admin = member('member-8', 'admin');
    repository.memberRecords.set(admin.id, admin);
    const service = createReviewService(repository);

    const hidden = await service.changePublication(admin, visitId, 'hide');
    const republished = await service.changePublication(admin, visitId, 'republish');
    const unchanged = await service.changePublication(admin, visitId, 'republish');

    expect(hidden.publicationState).toBe('hidden');
    expect(republished).toMatchObject({
      publicationState: 'published',
      publicationReason: 'admin_override',
    });
    expect(unchanged.publicationState).toBe('published');
    expect(repository.events.map((event) => event.action)).toEqual(['hide', 'republish']);
  });

  it('keeps a visit private when an admin tries to publish without contributions', async () => {
    const repository = repositoryWithScores(0);
    const admin = member('member-8', 'admin');
    const service = createReviewService(repository);

    const result = await service.changePublication(admin, visitId, 'publish_early');

    expect(result.publicationState).toBe('private');
    expect(repository.events).toHaveLength(0);
  });
});
