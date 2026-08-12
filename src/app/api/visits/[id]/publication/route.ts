import { publicationCommandSchema } from '@/domain/reviews/schemas';
import { requireAdmin } from '@/lib/auth/access';
import { parseJsonBody, toErrorResponse } from '@/lib/http/errors';
import { getReviewService } from '@/lib/reviews/server';

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
    return toErrorResponse(error);
  }
}
