import { resolvePublication, type PublicationCommand } from './publication';
import type {
  MemberRecord,
  PhotoInput,
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
  attachPhoto(actor: MemberRecord, visitId: string, photo: PhotoInput): Promise<void>;
  removePhoto(actor: MemberRecord, visitId: string, photoId: string): Promise<void>;
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

    async attachPhoto(actor, visitId, photo) {
      const visit = await repository.findVisitById(visitId);
      if (!visit) throw new Error('Visita não encontrada.');
      await repository.attachPhoto(visitId, actor.id, photo);
    },

    async removePhoto(actor, visitId, photoId) {
      const photo = await repository.findPhotoById(photoId);
      if (!photo || photo.visitId !== visitId) throw new Error('Foto não encontrada.');
      if (actor.role !== 'admin' && photo.uploadedBy !== actor.id) {
        throw new Error('Apenas o autor da foto ou um administrador pode removê-la.');
      }
      await repository.deletePhoto(visitId, photoId, actor.id);
    },
  };
}
