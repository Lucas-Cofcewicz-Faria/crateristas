import { resolvePublication, type PublicationCommand } from './publication';
import type {
  MemberRecord,
  PhotoInput,
  PhotoRecord,
  ReviewRepository,
  SubmissionResult,
  VisitRecord,
} from './repository';
import {
  createVisitSchema,
  publicationCommandSchema,
  scorecardSchema,
  type CreateVisitInput,
  type ScorecardInput,
} from './schemas';

type AdministrativePublicationCommand = Exclude<PublicationCommand, 'scorecard_saved'>;

export interface ReviewService {
  createVisit(actor: MemberRecord, input: CreateVisitInput): Promise<VisitRecord>;
  submitScorecard(actor: MemberRecord, visitId: string, input: ScorecardInput): Promise<SubmissionResult>;
  changePublication(
    actor: MemberRecord,
    visitId: string,
    command: AdministrativePublicationCommand,
  ): Promise<VisitRecord>;
  authorizePhotoUpload(actor: MemberRecord, visitId: string): Promise<void>;
  attachPhoto(actor: MemberRecord, visitId: string, photo: PhotoInput): Promise<void>;
  preparePhotoRemoval(
    actor: MemberRecord,
    visitId: string,
    photoId: string,
  ): Promise<PhotoRecord | null>;
  removePhoto(actor: MemberRecord, visitId: string, photoId: string): Promise<PhotoRecord | null>;
}

export class VisitPhotoAuthorizationError extends Error {
  constructor() {
    super('Apenas o criador da visita ou um administrador pode gerenciar fotos.');
    this.name = 'VisitPhotoAuthorizationError';
  }
}

export class VisitPhotoCapacityError extends Error {
  constructor() {
    super('A visita já possui o máximo de cinco fotos.');
    this.name = 'VisitPhotoCapacityError';
  }
}

async function requireManagedVisit(
  repository: ReviewRepository,
  actor: MemberRecord,
  visitId: string,
): Promise<VisitRecord> {
  const visit = await repository.findVisitById(visitId);
  if (!visit) throw new Error('Visita não encontrada.');
  if (actor.role !== 'admin' && visit.createdBy !== actor.id) {
    throw new VisitPhotoAuthorizationError();
  }
  return visit;
}

async function authorizePhotoUpload(
  repository: ReviewRepository,
  actor: MemberRecord,
  visitId: string,
): Promise<void> {
  await requireManagedVisit(repository, actor, visitId);
  if (await repository.countVisitPhotos(visitId) >= 5) {
    throw new VisitPhotoCapacityError();
  }
}

function matchesPersistedPhoto(
  existing: PhotoRecord | null,
  actor: MemberRecord,
  visitId: string,
  photo: PhotoInput,
): boolean {
  return existing?.visitId === visitId
    && existing.uploadedBy === actor.id
    && existing.url === photo.url
    && existing.pathname === photo.pathname
    && existing.contentType === photo.contentType
    && existing.sizeBytes === photo.sizeBytes;
}

export function createReviewService(repository: ReviewRepository): ReviewService {
  return {
    async submitScorecard(actor, visitId, input) {
      const visit = await repository.findVisitById(visitId);
      if (!visit) throw new Error('Visita não encontrada.');

      const scorecard = scorecardSchema.parse(input);
      const transitionAtQuorum = resolvePublication({
        state: visit.publicationState,
        reason: visit.publicationReason,
        participantCount: visit.quorum,
        quorum: visit.quorum,
        command: 'scorecard_saved',
        isAdmin: actor.role === 'admin',
      });

      return repository.submitScorecardAtomically({
        visitId,
        memberId: actor.id,
        scorecard,
        expectedPublicationState: visit.publicationState,
        quorum: visit.quorum,
        transitionAtQuorum,
      });
    },

    async createVisit(actor, input) {
      return repository.createVisit(actor.id, createVisitSchema.parse(input));
    },

    async changePublication(actor, visitId, commandInput) {
      if (actor.role !== 'admin') {
        throw new Error('Apenas administradores podem alterar a publicação.');
      }

      const command = publicationCommandSchema.parse(commandInput);
      const visit = await repository.findVisitById(visitId);
      if (!visit) throw new Error('Visita não encontrada.');
      const participantCount = await repository.countScorecards(visitId);
      const next = resolvePublication({
        state: visit.publicationState,
        reason: visit.publicationReason,
        participantCount,
        quorum: visit.quorum,
        command,
        isAdmin: true,
      });

      if (next.state === visit.publicationState && next.reason === visit.publicationReason) {
        return visit;
      }

      return repository.changePublicationAtomically({
        visitId,
        expectedPublicationState: visit.publicationState,
        state: next.state,
        reason: next.reason,
        actorId: actor.id,
        action: command,
      });
    },

    async authorizePhotoUpload(actor, visitId) {
      await authorizePhotoUpload(repository, actor, visitId);
    },

    async attachPhoto(actor, visitId, photo) {
      await requireManagedVisit(repository, actor, visitId);
      if (photo.contentType !== 'image/webp' || !Number.isInteger(photo.sizeBytes)
        || photo.sizeBytes < 1 || photo.sizeBytes > 750_000) {
        throw new Error('Os dados da foto comprimida são inválidos.');
      }
      const existing = await repository.findPhotoByPathname(photo.pathname);
      if (matchesPersistedPhoto(existing, actor, visitId, photo)) return;
      if (existing) throw new Error('O caminho da foto já está em uso.');
      if (await repository.countVisitPhotos(visitId) >= 5) {
        throw new VisitPhotoCapacityError();
      }
      try {
        await repository.attachPhoto(visitId, actor.id, photo);
      } catch (error) {
        const persistedAfterFailure = await repository.findPhotoByPathname(photo.pathname);
        if (matchesPersistedPhoto(persistedAfterFailure, actor, visitId, photo)) return;
        if (error instanceof Error
          && error.message === 'A visita já possui o máximo de cinco fotos.') {
          throw new VisitPhotoCapacityError();
        }
        throw error;
      }
    },

    async preparePhotoRemoval(actor, visitId, photoId) {
      await requireManagedVisit(repository, actor, visitId);
      const photo = await repository.findPhotoById(photoId);
      return photo?.visitId === visitId ? photo : null;
    },

    async removePhoto(actor, visitId, photoId) {
      await requireManagedVisit(repository, actor, visitId);
      return repository.deletePhoto(visitId, photoId, actor.id);
    },
  };
}
