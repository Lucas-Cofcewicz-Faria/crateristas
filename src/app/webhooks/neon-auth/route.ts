import { authorizeNeonUserCreation } from '@/lib/auth/webhook';

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
    });

    if (result.allowed) return Response.json({ allowed: true });
    return Response.json(blockedResponse);
  } catch {
    return Response.json(blockedResponse, { status: 403 });
  }
}
