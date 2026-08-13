import type { CreateVisitInput, ScorecardInput } from '@/domain/reviews/schemas';
import type { PublicationState, ReviewAggregate } from '@/domain/reviews/types';
import type { GoogleMapsSuggestions } from './google-maps-types';

export interface CreatedVisitResponse {
  id: string;
  slug: string;
  publicationState: PublicationState;
}

export interface SubmittedScorecardResponse {
  participantCount: number;
  publicationState: PublicationState;
  aggregate: ReviewAggregate;
}

export type AdminPublicationCommand = 'publish_early' | 'hide' | 'republish';

export interface PublicationResponse {
  publicationState: PublicationState;
  publicationReason: 'quorum' | 'admin_override' | null;
}

function isPublicationState(value: unknown): value is PublicationState {
  return value === 'private' || value === 'published' || value === 'hidden';
}

export async function createVisit(input: CreateVisitInput): Promise<CreatedVisitResponse> {
  const response = await fetch('/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('create_visit_failed');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('create_visit_failed');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.slug !== 'string'
    || !isPublicationState(record.publicationState)) {
    throw new Error('create_visit_failed');
  }
  return {
    id: record.id,
    slug: record.slug,
    publicationState: record.publicationState,
  };
}

export async function submitScorecard(
  visitId: string,
  input: ScorecardInput,
): Promise<SubmittedScorecardResponse> {
  const response = await fetch(`/api/visits/${encodeURIComponent(visitId)}/scorecard`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('submit_scorecard_failed');
  return response.json() as Promise<SubmittedScorecardResponse>;
}

export async function importGoogleMaps(url: string): Promise<GoogleMapsSuggestions> {
  const response = await fetch('/api/parse-maps', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error('import_google_maps_failed');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('import_google_maps_failed');
  }
  const record = payload as Record<string, unknown>;
  const result: GoogleMapsSuggestions = {};
  for (const field of ['name', 'cuisine', 'neighborhood', 'city', 'address'] as const) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) result[field] = value.trim();
  }
  if (Object.keys(result).length === 0) throw new Error('import_google_maps_failed');
  return result;
}

export async function changePublication(
  visitId: string,
  command: AdminPublicationCommand,
): Promise<PublicationResponse> {
  const response = await fetch(`/api/visits/${encodeURIComponent(visitId)}/publication`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('change_publication_failed');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('change_publication_failed');
  }
  const record = payload as Record<string, unknown>;
  if (!isPublicationState(record.publicationState)
    || (record.publicationReason !== null
      && record.publicationReason !== 'quorum'
      && record.publicationReason !== 'admin_override')) {
    throw new Error('change_publication_failed');
  }
  return {
    publicationState: record.publicationState,
    publicationReason: record.publicationReason,
  };
}
