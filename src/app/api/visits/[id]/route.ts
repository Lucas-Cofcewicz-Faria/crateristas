import type { del } from '@vercel/blob';
import type { MemberRecord, VisitDeletionTarget } from '@/domain/reviews/repository';
import {
  VISIT_DELETION_CONFIRMATION,
  VisitDeletionConflictError,
} from '@/domain/reviews/deletion';
import { VisitDeletionAuthorizationError, createReviewService } from '@/domain/reviews/service';
import {
  PhotoPolicyError,
  validateCompletedVisitPhotoPathname,
  validatePhotoIdentifier,
} from '@/features/visits/photo-policy';
import { createNeonReviewRepository } from '@/lib/repositories/neon-review-repository';

type RouteContext = { params: Promise<{ id: string }> };

export interface VisitDeletionRouteDependencies {
  requireMember(): Promise<MemberRecord>;
  prepareVisitDeletion(
    actor: MemberRecord,
    visitId: string,
    expectedParticipantCount: number,
  ): Promise<VisitDeletionTarget | null>;
  deleteVisit(
    actor: MemberRecord,
    visitId: string,
    expectedPhotoPathnames: string[],
  ): Promise<boolean>;
  del: typeof del;
}

class VisitDeletionRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisitDeletionRequestError';
  }
}

async function parseConfirmation(request: Request): Promise<number> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new VisitDeletionRequestError('Confirme a exclusão com a frase solicitada.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new VisitDeletionRequestError('Confirme a exclusão com a frase solicitada.');
  }
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(',') !== 'confirmation,expectedParticipantCount'
    || record.confirmation !== VISIT_DELETION_CONFIRMATION
    || !Number.isInteger(record.expectedParticipantCount)
    || Number(record.expectedParticipantCount) < 0
    || Number(record.expectedParticipantCount) > 8) {
    throw new VisitDeletionRequestError('Confirme a exclusão com a frase solicitada.');
  }
  return Number(record.expectedParticipantCount);
}

function deletionErrorResponse(error: unknown): Response {
  if (error instanceof VisitDeletionRequestError || error instanceof PhotoPolicyError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof VisitDeletionAuthorizationError
    || (error instanceof Error && error.name === 'VisitDeletionAuthorizationError')) {
    return Response.json({ error: 'Você não tem permissão para excluir esta review.' }, { status: 403 });
  }
  if (error instanceof VisitDeletionConflictError
    || (error instanceof Error && error.name === 'VisitDeletionConflictError')) {
    return Response.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof Error && error.name === 'AuthenticationError') {
    return Response.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  }
  return Response.json({ error: 'Não foi possível excluir a review. Tente novamente.' }, { status: 500 });
}

export function createVisitDeletionRouteHandlers(
  resolveDependencies: () => Promise<VisitDeletionRouteDependencies>,
) {
  return {
    async DELETE(request: Request, context: RouteContext): Promise<Response> {
      try {
        const expectedParticipantCount = await parseConfirmation(request);
        const { id: rawVisitId } = await context.params;
        const visitId = validatePhotoIdentifier(
          rawVisitId,
          'O identificador da review é inválido.',
        );
        const dependencies = await resolveDependencies();
        const actor = await dependencies.requireMember();
        const target = await dependencies.prepareVisitDeletion(
          actor,
          visitId,
          expectedParticipantCount,
        );
        if (!target) return new Response(null, { status: 204 });

        const pathnames = target.photoPathnames.map((pathname) => (
          validateCompletedVisitPhotoPathname(visitId, pathname)
        ));
        if (pathnames.length > 0) await dependencies.del(pathnames);
        const deleted = await dependencies.deleteVisit(actor, visitId, pathnames);
        if (!deleted && await dependencies.prepareVisitDeletion(
          actor,
          visitId,
          expectedParticipantCount,
        )) {
          throw new VisitDeletionConflictError();
        }
        return new Response(null, { status: 204 });
      } catch (error) {
        return deletionErrorResponse(error);
      }
    },
  };
}

async function resolveProductionDependencies(): Promise<VisitDeletionRouteDependencies> {
  const [blob, authAccess] = await Promise.all([
    import('@vercel/blob'),
    import('@/lib/auth/access'),
  ]);
  const repository = createNeonReviewRepository();
  const service = createReviewService(repository);
  return {
    requireMember: authAccess.requireMember,
    prepareVisitDeletion: service.prepareVisitDeletion,
    deleteVisit: service.deleteVisit,
    del: blob.del,
  };
}

const productionHandlers = createVisitDeletionRouteHandlers(resolveProductionDependencies);

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return productionHandlers.DELETE(request, context);
}
