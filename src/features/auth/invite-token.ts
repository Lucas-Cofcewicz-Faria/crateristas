import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export function createInviteToken(version: string, secret: string): string {
  if (secret.length < 32) throw new Error('Configuração do convite indisponível.');
  const signature = createHmac('sha256', secret).update(`crateristas:invite:v1:${version}`).digest('base64url');
  return `${version}.${signature}`;
}

export function verifyInviteToken(token: string, version: string, secret: string): boolean {
  const expected = Buffer.from(createInviteToken(version, secret));
  const actual = Buffer.from(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashEnrollmentToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
