import { createVisitSchema } from '@/domain/reviews/schemas';
import { requireMember } from '@/lib/auth/access';
import { parseJsonBody, toErrorResponse } from '@/lib/http/errors';
import { getReviewService } from '@/lib/reviews/server';

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await requireMember();
    const input = createVisitSchema.parse(await parseJsonBody(request));
    const visit = await getReviewService().createVisit(actor, input);

    return Response.json(
      {
        id: visit.id,
        slug: visit.slug,
        publicationState: visit.publicationState,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
