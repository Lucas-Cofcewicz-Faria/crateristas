import {
  createPublicKey,
  verify as verifyDetachedSignature,
  type JsonWebKey,
} from 'node:crypto';

const REQUIRED_EVENT_TYPE = 'user.before_create';
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

interface WebhookEnvironment {
  [key: string]: string | undefined;
  NEON_AUTH_BASE_URL?: string;
  NEON_AUTH_ALLOWED_EMAILS?: string;
}

interface AuthorizeNeonUserCreationInput {
  rawBody: string;
  headers: Headers;
  environment?: WebhookEnvironment;
  fetcher?: typeof fetch;
  now?: () => number;
  isInvitedEmail?: (email: string) => Promise<boolean>;
}

interface NeonWebhookConfig {
  jwksUrl: string;
  allowedEmails: ReadonlySet<string>;
}

export class NeonWebhookConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeonWebhookConfigurationError';
  }
}

export class NeonWebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeonWebhookVerificationError';
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readWebhookConfig(environment: WebhookEnvironment): NeonWebhookConfig {
  const baseUrlValue = environment.NEON_AUTH_BASE_URL?.trim();
  if (!baseUrlValue) {
    throw new NeonWebhookConfigurationError('NEON_AUTH_BASE_URL não configurada.');
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlValue);
  } catch {
    throw new NeonWebhookConfigurationError('NEON_AUTH_BASE_URL inválida.');
  }

  if (baseUrl.protocol !== 'https:') {
    throw new NeonWebhookConfigurationError('NEON_AUTH_BASE_URL deve usar HTTPS.');
  }

  const allowedEmails = (environment.NEON_AUTH_ALLOWED_EMAILS ?? '')
    .split(',')
    .map(normalizeEmail);
  const uniqueEmails = new Set(allowedEmails);

  if (
    allowedEmails.length < 1 ||
    uniqueEmails.size !== allowedEmails.length ||
    allowedEmails.some((email) => !EMAIL_PATTERN.test(email))
  ) {
    throw new NeonWebhookConfigurationError(
      'NEON_AUTH_ALLOWED_EMAILS deve conter emails únicos e válidos.',
    );
  }

  const jwksUrl = new URL(baseUrl);
  jwksUrl.pathname = `${jwksUrl.pathname.replace(/\/+$/, '')}/.well-known/jwks.json`;
  jwksUrl.search = '';
  jwksUrl.hash = '';

  return { jwksUrl: jwksUrl.toString(), allowedEmails: uniqueEmails };
}

function requiredHeader(headers: Headers, name: string): string {
  const value = headers.get(name)?.trim();
  if (!value) throw new NeonWebhookVerificationError(`Header ${name} ausente.`);
  return value;
}

function parseProtectedHeader(encodedHeader: string): Record<string, unknown> {
  if (!BASE64URL_PATTERN.test(encodedHeader)) {
    throw new NeonWebhookVerificationError('Header JWS inválido.');
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
    if (!isRecord(parsed)) throw new Error('invalid');
    return parsed;
  } catch {
    throw new NeonWebhookVerificationError('Header JWS inválido.');
  }
}

function parseDetachedSignature(signature: string) {
  const parts = signature.split('.');
  if (
    parts.length !== 3 ||
    !parts[0] ||
    parts[1] !== '' ||
    !parts[2] ||
    !BASE64URL_PATTERN.test(parts[2])
  ) {
    throw new NeonWebhookVerificationError('Assinatura JWS destacada inválida.');
  }

  return { encodedHeader: parts[0], encodedSignature: parts[2] };
}

function parseFreshTimestamp(value: string, now: () => number): string {
  if (!/^\d+$/.test(value)) {
    throw new NeonWebhookVerificationError('Timestamp do webhook inválido.');
  }

  const timestamp = Number(value);
  if (!Number.isSafeInteger(timestamp) || Math.abs(now() - timestamp) > MAX_TIMESTAMP_AGE_MS) {
    throw new NeonWebhookVerificationError('Timestamp do webhook fora da janela permitida.');
  }

  return value;
}

async function loadSigningKey(jwksUrl: string, kid: string, fetcher: typeof fetch) {
  let response: Response;
  try {
    response = await fetcher(jwksUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new NeonWebhookVerificationError('Não foi possível consultar o JWKS do Neon Auth.');
  }

  if (!response.ok) {
    throw new NeonWebhookVerificationError('Não foi possível consultar o JWKS do Neon Auth.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new NeonWebhookVerificationError('JWKS do Neon Auth inválido.');
  }

  if (!isRecord(payload) || !Array.isArray(payload.keys)) {
    throw new NeonWebhookVerificationError('JWKS do Neon Auth inválido.');
  }

  const key = payload.keys.find((candidate) => isRecord(candidate) && candidate.kid === kid);
  if (
    !isRecord(key) ||
    key.kty !== 'OKP' ||
    key.crv !== 'Ed25519' ||
    typeof key.x !== 'string' ||
    (key.alg !== undefined && key.alg !== 'EdDSA') ||
    (key.use !== undefined && key.use !== 'sig')
  ) {
    throw new NeonWebhookVerificationError('Chave de assinatura não encontrada no JWKS.');
  }

  try {
    return createPublicKey({ key: key as JsonWebKey, format: 'jwk' });
  } catch {
    throw new NeonWebhookVerificationError('Chave pública do webhook inválida.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function authorizeNeonUserCreation({
  rawBody,
  headers,
  environment = process.env,
  fetcher = fetch,
  now = Date.now,
  isInvitedEmail = async () => false,
}: AuthorizeNeonUserCreationInput): Promise<{ allowed: boolean }> {
  const config = readWebhookConfig(environment);
  const signature = requiredHeader(headers, 'X-Neon-Signature');
  const transportKid = requiredHeader(headers, 'X-Neon-Signature-Kid');
  const timestamp = parseFreshTimestamp(requiredHeader(headers, 'X-Neon-Timestamp'), now);
  const transportEventType = requiredHeader(headers, 'X-Neon-Event-Type');

  if (transportEventType !== REQUIRED_EVENT_TYPE) {
    throw new NeonWebhookVerificationError('Tipo de evento do webhook inválido.');
  }

  const { encodedHeader, encodedSignature } = parseDetachedSignature(signature);
  const protectedHeader = parseProtectedHeader(encodedHeader);
  if (
    protectedHeader.alg !== 'EdDSA' ||
    protectedHeader.typ !== 'JWS' ||
    protectedHeader.kid !== transportKid
  ) {
    throw new NeonWebhookVerificationError('Cabeçalho protegido do webhook inválido.');
  }

  const publicKey = await loadSigningKey(config.jwksUrl, transportKid, fetcher);
  const bodyBase64 = Buffer.from(rawBody, 'utf8').toString('base64url');
  const timestampedPayload = Buffer.from(`${timestamp}.${bodyBase64}`, 'utf8').toString('base64url');
  const signingInput = `${encodedHeader}.${timestampedPayload}`;
  const signatureIsValid = verifyDetachedSignature(
    null,
    Buffer.from(signingInput),
    publicKey,
    Buffer.from(encodedSignature, 'base64url'),
  );

  if (!signatureIsValid) {
    throw new NeonWebhookVerificationError('Assinatura do webhook inválida.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new NeonWebhookVerificationError('Corpo do webhook inválido.');
  }

  if (
    !isRecord(payload) ||
    payload.event_type !== REQUIRED_EVENT_TYPE ||
    !isRecord(payload.user) ||
    typeof payload.user.email !== 'string'
  ) {
    throw new NeonWebhookVerificationError('Evento assinado do webhook inválido.');
  }

  const email = normalizeEmail(payload.user.email);
  return { allowed: config.allowedEmails.has(email) || await isInvitedEmail(email) };
}
