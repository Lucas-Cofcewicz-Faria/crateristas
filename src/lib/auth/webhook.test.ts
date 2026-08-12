import {
  generateKeyPairSync,
  sign as signDetachedPayload,
  type KeyObject,
} from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  authorizeNeonUserCreation,
  NeonWebhookConfigurationError,
  NeonWebhookVerificationError,
} from './webhook';

const NOW = Date.parse('2026-08-11T18:00:00.000Z');
const ALLOWED_EMAILS = Array.from(
  { length: 8 },
  (_, index) => `membro${String(index + 1).padStart(2, '0')}@example.com`,
);

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const KID = 'chave-webhook-01';
const PUBLIC_JWK = {
  ...publicKey.export({ format: 'jwk' }),
  alg: 'EdDSA',
  kid: KID,
  use: 'sig',
};

function webhookPayload(email: string, eventType = 'user.before_create') {
  return {
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    event_type: eventType,
    timestamp: '2026-08-11T18:00:00.000Z',
    context: {
      endpoint_id: 'ep-cratera-12345678',
      project_name: 'Crateristas',
    },
    user: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      email,
      name: 'Membro da sociedade',
      email_verified: false,
      created_at: '2026-08-11T18:00:00.000Z',
    },
    event_data: {
      auth_provider: 'credential',
      ip_address: '192.0.2.1',
      user_agent: 'Vitest',
    },
  };
}

function signedWebhook(
  payload: ReturnType<typeof webhookPayload>,
  options: {
    headerEventType?: string;
    headerKid?: string;
    protectedKid?: string;
    timestamp?: number;
    signingKey?: KeyObject;
  } = {},
) {
  const rawBody = JSON.stringify(payload);
  const timestamp = String(options.timestamp ?? NOW);
  const protectedHeader = Buffer.from(
    JSON.stringify({
      alg: 'EdDSA',
      typ: 'JWS',
      kid: options.protectedKid ?? KID,
    }),
  ).toString('base64url');
  const bodyBase64 = Buffer.from(rawBody, 'utf8').toString('base64url');
  const timestampedPayload = Buffer.from(`${timestamp}.${bodyBase64}`, 'utf8').toString(
    'base64url',
  );
  const signingInput = `${protectedHeader}.${timestampedPayload}`;
  const signature = signDetachedPayload(
    null,
    Buffer.from(signingInput),
    options.signingKey ?? privateKey,
  ).toString('base64url');

  return {
    rawBody,
    headers: new Headers({
      'X-Neon-Signature': `${protectedHeader}..${signature}`,
      'X-Neon-Signature-Kid': options.headerKid ?? KID,
      'X-Neon-Timestamp': timestamp,
      'X-Neon-Event-Type': options.headerEventType ?? 'user.before_create',
      'X-Neon-Event-Id': payload.event_id,
      'X-Neon-Delivery-Attempt': '1',
    }),
  };
}

function dependencies(...args: [allowedEmails?: string]) {
  const allowedEmails = args.length === 0 ? ALLOWED_EMAILS.join(',') : args[0];
  return {
    environment: {
      NEON_AUTH_BASE_URL: 'https://ep-example.neonauth.example/neondb/auth',
      NEON_AUTH_ALLOWED_EMAILS: allowedEmails,
    },
    now: () => NOW,
    fetcher: vi.fn(async () => Response.json({ keys: [PUBLIC_JWK] })),
  };
}

describe('webhook bloqueante de criação de usuários', () => {
  it('autoriza um dos oito emails após normalização e assinatura válida', async () => {
    const webhook = signedWebhook(webhookPayload('  MEMBRO01@EXAMPLE.COM  '));

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).resolves.toEqual({ allowed: true });
  });

  it('nega um nono email mesmo com assinatura válida', async () => {
    const webhook = signedWebhook(webhookPayload('intruso@example.com'));

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).resolves.toEqual({ allowed: false });
  });

  it.each([
    ['variável ausente', undefined],
    ['somente sete emails', ALLOWED_EMAILS.slice(0, 7).join(',')],
    ['nono item vazio', `${ALLOWED_EMAILS.join(',')},`],
    [
      'email duplicado após normalização',
      [...ALLOWED_EMAILS.slice(0, 7), ' MEMBRO01@EXAMPLE.COM '].join(','),
    ],
  ])('falha fechado com allowlist inválida: %s', async (_case, allowedEmails) => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]));
    const config = dependencies(allowedEmails);

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...config }),
    ).rejects.toBeInstanceOf(NeonWebhookConfigurationError);
  });

  it.each([
    ['ausente', undefined],
    ['sem HTTPS', 'http://ep-example.neonauth.example/neondb/auth'],
    ['inválida', 'não-é-uma-url'],
  ])('falha fechado com NEON_AUTH_BASE_URL %s', async (_case, baseUrl) => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]));
    const config = dependencies();
    const environment = { ...config.environment, NEON_AUTH_BASE_URL: baseUrl };

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...config, environment }),
    ).rejects.toBeInstanceOf(NeonWebhookConfigurationError);
  });

  it('rejeita assinatura que não corresponde ao corpo bruto', async () => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]));
    webhook.rawBody = `${webhook.rawBody} `;

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).rejects.toBeInstanceOf(NeonWebhookVerificationError);
  });

  it.each([
    ['antigo', NOW - 5 * 60 * 1000 - 1],
    ['futuro', NOW + 5 * 60 * 1000 + 1],
  ])('rejeita timestamp %s fora da janela de cinco minutos', async (_case, timestamp) => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]), { timestamp });

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).rejects.toBeInstanceOf(NeonWebhookVerificationError);
  });

  it('rejeita evento de header diferente de user.before_create', async () => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]), {
      headerEventType: 'user.created',
    });

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).rejects.toBeInstanceOf(NeonWebhookVerificationError);
  });

  it('rejeita evento assinado no corpo diferente de user.before_create', async () => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0], 'user.created'));

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).rejects.toBeInstanceOf(NeonWebhookVerificationError);
  });

  it('rejeita kid protegido diferente do header de transporte', async () => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]), {
      protectedKid: 'outra-chave',
    });

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...dependencies() }),
    ).rejects.toBeInstanceOf(NeonWebhookVerificationError);
  });

  it('falha fechado quando o JWKS do Neon Auth está indisponível', async () => {
    const webhook = signedWebhook(webhookPayload(ALLOWED_EMAILS[0]));
    const config = dependencies();
    config.fetcher.mockResolvedValue(new Response(null, { status: 503 }));

    await expect(
      authorizeNeonUserCreation({ ...webhook, ...config }),
    ).rejects.toBeInstanceOf(NeonWebhookVerificationError);
  });
});
