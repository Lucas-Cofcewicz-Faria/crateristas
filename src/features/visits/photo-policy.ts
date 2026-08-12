export const MAX_VISIT_PHOTOS = 5;
export const MAX_VISIT_PHOTO_BYTES = 750_000;
export const VISIT_PHOTO_CONTENT_TYPE = 'image/webp' as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENCODED_SEPARATOR_PATTERN = /%(?:2f|5c|00)/i;

export class PhotoPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoPolicyError';
  }
}

function validatedVisitId(visitId: string): string {
  if (!UUID_PATTERN.test(visitId)) {
    throw new PhotoPolicyError('O identificador da visita é inválido.');
  }
  return visitId.toLowerCase();
}

function sanitizedBasename(fileName: string): string {
  const leaf = fileName.split(/[\\/]/).at(-1) ?? '';
  const withoutExtension = leaf.replace(/\.[^.]*$/, '');
  const normalized = withoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return normalized || 'foto';
}

export function assertVisitPhotoCapacity(existingPhotoCount: number): void {
  if (!Number.isInteger(existingPhotoCount) || existingPhotoCount < 0) {
    throw new PhotoPolicyError('A quantidade atual de fotos é inválida.');
  }
  if (existingPhotoCount >= MAX_VISIT_PHOTOS) {
    throw new PhotoPolicyError('A visita já possui o máximo de cinco fotos.');
  }
}

export function assertVisitPhotoOutput(contentType: string, sizeBytes: number): void {
  if (contentType !== VISIT_PHOTO_CONTENT_TYPE) {
    throw new PhotoPolicyError('A foto enviada deve estar comprimida em WebP.');
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_VISIT_PHOTO_BYTES) {
    throw new PhotoPolicyError('A foto comprimida deve ter no máximo 750.000 bytes.');
  }
}

export function buildVisitPhotoPathname(visitId: string, fileName: string): string {
  return `visits/${validatedVisitId(visitId)}/${sanitizedBasename(fileName)}.webp`;
}

export function validatePhotoIdentifier(value: string, message: string): string {
  if (!UUID_PATTERN.test(value)) throw new PhotoPolicyError(message);
  return value.toLowerCase();
}

export function validateRequestedVisitPhotoPathname(
  visitId: string,
  requestedPathname: string,
): string {
  const safeVisitId = validatedVisitId(visitId);
  if (
    ENCODED_SEPARATOR_PATTERN.test(requestedPathname)
    || requestedPathname.includes('\\')
    || requestedPathname.includes('?')
    || requestedPathname.includes('#')
  ) {
    throw new PhotoPolicyError('O caminho solicitado para a foto é inválido.');
  }

  const prefix = `visits/${safeVisitId}/`;
  if (!requestedPathname.startsWith(prefix)) {
    throw new PhotoPolicyError('O caminho solicitado para a foto é inválido.');
  }

  const fileName = requestedPathname.slice(prefix.length);
  const expected = buildVisitPhotoPathname(safeVisitId, fileName);
  if (requestedPathname !== expected) {
    throw new PhotoPolicyError('O caminho solicitado para a foto é inválido.');
  }
  return expected;
}

export function validateCompletedVisitPhotoPathname(
  visitId: string,
  completedPathname: string,
): string {
  const safeVisitId = validatedVisitId(visitId);
  if (
    ENCODED_SEPARATOR_PATTERN.test(completedPathname)
    || completedPathname.includes('\\')
    || completedPathname.includes('?')
    || completedPathname.includes('#')
  ) {
    throw new PhotoPolicyError('O caminho concluído da foto é inválido.');
  }
  const prefix = `visits/${safeVisitId}/`;
  const fileName = completedPathname.startsWith(prefix)
    ? completedPathname.slice(prefix.length)
    : '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-[A-Za-z0-9]{6,64}\.webp$/.test(fileName)) {
    throw new PhotoPolicyError('O caminho concluído da foto é inválido.');
  }
  return completedPathname;
}
