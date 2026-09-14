import {
  authorizeNeonUserCreation,
  NeonWebhookConfigurationError,
  NeonWebhookVerificationError,
} from '@/lib/auth/webhook';
import { isInvitedEmail } from '@/features/auth/invite-repository';

export const runtime = 'nodejs';

const blockedResponse = {
  allowed: false,
  error_message: 'Cadastro não autorizado.',
  error_code: 'SIGNUP_BLOCKED',
} as const;

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const result = await authorizeNeonUserCreation({
      rawBody,
      headers: request.headers,
      isInvitedEmail,
    });

    if (result.allowed) return Response.json({ allowed: true });
    return Response.json(blockedResponse);
  } catch (error) {
    const knownError =
      error instanceof NeonWebhookConfigurationError ||
      error instanceof NeonWebhookVerificationError;
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Neon Auth webhook rejeitado',
        errorName: knownError ? error.name : 'UnknownError',
        errorMessage: knownError ? error.message : 'Falha inesperada.',
      }),
    );
    return Response.json(blockedResponse, { status: 403 });
  }
}
