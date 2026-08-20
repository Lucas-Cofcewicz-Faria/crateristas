import { generateKeyPairSync, sign } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const NOW = Date.parse('2026-08-11T18:00:00.000Z');
const KID = 'chave-rota-01';
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const jwk = { ...publicKey.export({ format: 'jwk' }), alg: 'EdDSA', kid: KID, use: 'sig' };

function signedRequest(email: string, tamperBody = false) {
  const payload = {
    event_id: '550e8400-e29b-41d4-a716-446655440000',
    event_type: 'user.before_create',
    timestamp: '2026-08-11T18:00:00.000Z',
    context: { endpoint_id: 'ep-cratera', project_name: 'Crateristas' },
    user: { id: 'auth-user', email, name: 'Membro', email_verified: false },
    event_data: {
      auth_provider: 'credential',
      ip_address: '192.0.2.1',
      user_agent: 'Vitest',
    },
  };
  const signedBody = JSON.stringify(payload);
  const protectedHeader = Buffer.from(
    JSON.stringify({ alg: 'EdDSA', typ: 'JWS', kid: KID }),
  ).toString('base64url');
  const bodyBase64 = Buffer.from(signedBody).toString('base64url');
  const signaturePayload = Buffer.from(`${NOW}.${bodyBase64}`).toString('base64url');
  const signature = sign(
    null,
    Buffer.from(`${protectedHeader}.${signaturePayload}`),
    privateKey,
  ).toString('base64url');

  return new Request('https://crateristas.example/webhooks/neon-auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Neon-Signature': `${protectedHeader}..${signature}`,
      'X-Neon-Signature-Kid': KID,
      'X-Neon-Timestamp': String(NOW),
      'X-Neon-Event-Type': 'user.before_create',
      'X-Neon-Event-Id': payload.event_id,
      'X-Neon-Delivery-Attempt': '1',
    },
    body: tamperBody ? `${signedBody} ` : signedBody,
  });
}

describe('POST /webhooks/neon-auth', () => {
  beforeEach(() => {
    vi.stubEnv('NEON_AUTH_BASE_URL', 'https://ep-example.neonauth.example/neondb/auth');
    vi.stubEnv(
      'NEON_AUTH_ALLOWED_EMAILS',
      Array.from(
        { length: 8 },
        (_, index) => `membro${String(index + 1).padStart(2, '0')}@example.com`,
      ).join(','),
    );
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ keys: [jwk] })));
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('retorna allowed true somente para email permitido e assinatura válida', async () => {
    const response = await POST(signedRequest('membro01@example.com'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ allowed: true });
  });

  it('falha fechado quando o corpo bruto não corresponde à assinatura', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(signedRequest('membro01@example.com', true));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      allowed: false,
      error_message: 'Cadastro não autorizado.',
      error_code: 'SIGNUP_BLOCKED',
    });
    expect(errorLog).toHaveBeenCalledOnce();
    expect(JSON.parse(String(errorLog.mock.calls[0][0]))).toEqual({
      level: 'error',
      message: 'Neon Auth webhook rejeitado',
      errorName: 'NeonWebhookVerificationError',
      errorMessage: 'Assinatura do webhook inválida.',
    });
  });

  it('nega um nono email mesmo quando a assinatura é válida', async () => {
    const response = await POST(signedRequest('intruso@example.com'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      allowed: false,
      error_message: 'Cadastro não autorizado.',
      error_code: 'SIGNUP_BLOCKED',
    });
  });

  it('falha fechado quando a allowlist não está configurada', async () => {
    vi.stubEnv('NEON_AUTH_ALLOWED_EMAILS', '');

    const response = await POST(signedRequest('membro01@example.com'));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      allowed: false,
      error_message: 'Cadastro não autorizado.',
      error_code: 'SIGNUP_BLOCKED',
    });
  });
});
