import { ZodError } from 'zod';
import { AuthenticationError, AuthorizationError } from '@/lib/auth/access';

export class MalformedJsonError extends Error {
  constructor() {
    super('O corpo da requisição deve conter JSON válido.');
    this.name = 'MalformedJsonError';
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new MalformedJsonError();
    throw error;
  }
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof AuthenticationError) {
    return Response.json(
      { error: 'Sessão expirada. Entre novamente.' },
      { status: 401 },
    );
  }

  if (error instanceof AuthorizationError) {
    return Response.json(
      { error: 'Você não tem permissão para esta ação.' },
      { status: 403 },
    );
  }

  if (error instanceof MalformedJsonError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: 'Revise os campos informados.',
        fields: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  return Response.json(
    { error: 'Não foi possível concluir a operação.' },
    { status: 500 },
  );
}
