import { scorecardSchema } from '@/domain/reviews/schemas';
import { requireMember } from '@/lib/auth/access';
import { parseJsonBody, toErrorResponse } from '@/lib/http/errors';
import { getReviewService } from '@/lib/reviews/server';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const actor = await requireMember();
    const { id } = await context.params;
    const input = scorecardSchema.parse(await parseJsonBody(request));
    const result = await getReviewService().submitScorecard(actor, id, input);

    return Response.json({
      participantCount: result.participantCount,
      publicationState: result.publicationState,
      aggregate: result.aggregate,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
