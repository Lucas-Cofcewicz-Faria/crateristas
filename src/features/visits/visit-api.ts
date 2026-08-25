import { z } from 'zod';
import { VISIT_DELETION_CONFIRMATION } from '@/domain/reviews/deletion';
import type { PublicPhoto } from '@/domain/reviews/repository';
import type { CreateVisitInput, ScorecardInput } from '@/domain/reviews/schemas';
import {
  CRATERISTAS_GROUP_SIZE,
  type PublicationState,
  type ScoreValues,
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
  aggregate: {
    participantCount: number;
    averages: ScoreValues;
    overall: number;
  };
}

export type AdminPublicationCommand = 'publish_early' | 'hide' | 'republish';

export interface PublicationResponse {
  publicationState: PublicationState;
  publicationReason: 'quorum' | 'admin_override' | null;
}

export class VisitDeletionOutdatedError extends Error {
  constructor() {
    super('A quantidade de avaliações mudou.');
    this.name = 'VisitDeletionOutdatedError';
  }
}

export async function deleteVisit(
  visitId: string,
  confirmation: typeof VISIT_DELETION_CONFIRMATION,
  expectedParticipantCount: number,
): Promise<void> {
  const response = await fetch(`/api/visits/${encodeURIComponent(visitId)}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirmation, expectedParticipantCount }),
  });
  if (response.status === 409) throw new VisitDeletionOutdatedError();
  if (response.status !== 204) throw new Error('delete_visit_failed');
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
const participantCountSchema = z.number().int().min(1).max(CRATERISTAS_GROUP_SIZE);
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
    averages: scoreAveragesSchema,
    overall: aggregateScoreSchema,
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

const PHOTO_CONFIRMATION_DELAYS_MS = [250, 500, 1_000, 2_000] as const;
type PollWait = (delayMs: number, signal: AbortSignal) => Promise<void>;

export class PhotoProcessingFailedError extends Error {
  constructor() {
    super('photo_processing_failed');
    this.name = 'PhotoProcessingFailedError';
  }
}

export async function confirmUploadedPhoto(
  visitId: string,
  pathname: string,
  signal: AbortSignal,
  options: { wait?: PollWait } = {},
): Promise<PublicPhoto> {
  const wait = options.wait ?? waitForPollInterval;
  for (let attempt = 0; attempt <= PHOTO_CONFIRMATION_DELAYS_MS.length; attempt += 1) {
    const response = await fetch(
      `/api/visits/${encodeURIComponent(visitId)}/photos?pathname=${encodeURIComponent(pathname)}`,
      { cache: 'no-store', method: 'GET', signal },
    );
    if (response.status === 202) {
      const delayMs = PHOTO_CONFIRMATION_DELAYS_MS[attempt];
      if (delayMs === undefined) break;
      await wait(delayMs, signal);
      continue;
    }
    if (response.status === 410) throw new PhotoProcessingFailedError();
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
