import { z } from 'zod';
import type { PublicPhoto } from '@/domain/reviews/repository';
import type { CreateVisitInput, ScorecardInput } from '@/domain/reviews/schemas';
import {
  CRATERISTAS_GROUP_SIZE,
  type PublicationState,
  type ReviewAggregate,
} from '@/domain/reviews/types';
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

const publicationStateSchema = z.enum(['private', 'published', 'hidden']);
const createdVisitResponseSchema = z.object({
  id: z.uuid(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publicationState: publicationStateSchema,
});
const participantCountSchema = z.number().int().min(0).max(CRATERISTAS_GROUP_SIZE);
const aggregateScoreSchema = z.number().finite().min(0).max(10);
const scoreAveragesSchema = z.object({
  food: aggregateScoreSchema,
  service: aggregateScoreSchema,
  ambience: aggregateScoreSchema,
  value: aggregateScoreSchema,
  access: aggregateScoreSchema,
  waitTime: aggregateScoreSchema,
});
const submittedScorecardResponseSchema = z.object({
  participantCount: participantCountSchema,
  publicationState: publicationStateSchema,
  aggregate: z.object({
    participantCount: participantCountSchema,
    averages: scoreAveragesSchema.nullable(),
    overall: aggregateScoreSchema.nullable(),
  }),
}).refine((result) => result.participantCount === result.aggregate.participantCount);
const confirmedPhotoResponseSchema = z.object({
  photo: z.object({
    id: z.uuid(),
    url: z.url().refine((url) => new URL(url).protocol === 'https:'),
    position: z.number().int().min(1).max(5),
  }),
});

async function parseResponse<T>(response: Response, schema: z.ZodType<T>, error: string): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(error);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new Error(error);
  return parsed.data;
}

export async function createVisit(input: CreateVisitInput): Promise<CreatedVisitResponse> {
  const response = await fetch('/api/visits', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('create_visit_failed');
  return parseResponse(response, createdVisitResponseSchema, 'create_visit_failed');
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
  return parseResponse(response, submittedScorecardResponseSchema, 'submit_scorecard_failed');
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

function waitForPollInterval(intervalMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, intervalMs);
    function abort() {
      window.clearTimeout(timer);
      reject(new DOMException('aborted', 'AbortError'));
    }
    signal.addEventListener('abort', abort, { once: true });
  });
}

export async function confirmUploadedPhoto(
  visitId: string,
  pathname: string,
  signal: AbortSignal,
  options: { attempts?: number; intervalMs?: number } = {},
): Promise<PublicPhoto> {
  const attempts = options.attempts ?? 4;
  const intervalMs = options.intervalMs ?? 250;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(
      `/api/visits/${encodeURIComponent(visitId)}/photos?pathname=${encodeURIComponent(pathname)}`,
      { cache: 'no-store', method: 'GET', signal },
    );
    if (response.status === 202) {
      if (attempt === attempts) break;
      await waitForPollInterval(intervalMs, signal);
      continue;
    }
    if (!response.ok) throw new Error('confirm_photo_failed');
    const result = await parseResponse(
      response,
      confirmedPhotoResponseSchema,
      'confirm_photo_failed',
    );
    return result.photo;
  }
  throw new Error('confirm_photo_failed');
}
