import { publicationCommandSchema } from '@/domain/reviews/schemas';
import { requireAdmin } from '@/lib/auth/access';
import { parseJsonBody, toErrorResponse } from '@/lib/http/errors';
import { getReviewService } from '@/lib/reviews/server';

function publicationErrorDiagnostic(error: unknown): Record<string, string> {
  const diagnostic: Record<string, string> = {
    name: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : 'Erro sem mensagem.',
  };

  if (typeof error !== 'object' || error === null) {
    return diagnostic;
  }

  for (const field of ['code', 'column', 'table', 'constraint'] as const) {
    const value = (error as Record<string, unknown>)[field];
    if (typeof value === 'string') {
      diagnostic[field] = value;
    }
  }

  return diagnostic;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const command = publicationCommandSchema.parse(await parseJsonBody(request));
    const visit = await getReviewService().changePublication(actor, id, command);

    return Response.json({
      publicationState: visit.publicationState,
      publicationReason: visit.publicationReason,
    });
  } catch (error) {
    console.error('publication_change_failed', publicationErrorDiagnostic(error));
    return toErrorResponse(error);
  }
}
