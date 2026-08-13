import { z } from 'zod';
import {
  GoogleMapsExtractionError,
  GoogleMapsInputError,
  GoogleMapsUpstreamError,
  googleMapsSuggestionsSchema,
  importGoogleMapsSuggestions,
} from '@/features/visits/google-maps-import';
import type { GoogleMapsSuggestions } from '@/features/visits/google-maps-types';
import { requireMember } from '@/lib/auth/access';

const requestSchema = z.object({ url: z.string().trim().min(1).max(2_048) }).strict();

export interface GoogleMapsRouteDependencies {
  requireMember(): Promise<unknown>;
  importSuggestions(url: string): Promise<GoogleMapsSuggestions>;
}

function mapsErrorResponse(error: unknown): Response {
  if (error instanceof Error && error.name === 'AuthenticationError') {
    return Response.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
  }
  if (error instanceof Error && error.name === 'AuthorizationError') {
    return Response.json({ error: 'Você não tem permissão para esta ação.' }, { status: 403 });
  }
  if (error instanceof GoogleMapsInputError || error instanceof z.ZodError) {
    return Response.json({ error: 'Revise o link do Google Maps.' }, { status: 400 });
  }
  if (error instanceof GoogleMapsExtractionError) {
    return Response.json(
      { error: 'Não foi possível identificar os dados desse link.' },
      { status: 422 },
    );
  }
  if (error instanceof GoogleMapsUpstreamError) {
    return Response.json(
      { error: 'Não foi possível consultar o Google Maps agora.' },
      { status: 502 },
    );
  }
  return Response.json(
    { error: 'Não foi possível consultar o Google Maps agora.' },
    { status: 502 },
  );
}

export function createGoogleMapsRoute(dependencies: GoogleMapsRouteDependencies) {
  return async function POST(request: Request): Promise<Response> {
    try {
      await dependencies.requireMember();
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        throw new GoogleMapsInputError();
      }
      const { url } = requestSchema.parse(body);
      const suggestions = googleMapsSuggestionsSchema.parse(
        await dependencies.importSuggestions(url),
      );
      return Response.json(suggestions);
    } catch (error) {
      return mapsErrorResponse(error);
    }
  };
}

const productionPost = createGoogleMapsRoute({
  requireMember,
  importSuggestions: importGoogleMapsSuggestions,
});

export async function POST(request: Request): Promise<Response> {
  return productionPost(request);
}
