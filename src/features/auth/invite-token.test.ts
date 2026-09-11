import { describe, expect, it } from 'vitest';
import { createInviteToken, verifyInviteToken, hashEnrollmentToken } from './invite-token';

const secret = 'synthetic-test-secret-never-a-real-credential';
const version = 'b3d7c7cb-3f0f-4ee0-b088-e1208cb9a701';

describe('convite compartilhado', () => {
  it('permite reutilizar o mesmo convite sem expiração implícita', () => {
    const token = createInviteToken(version, secret);
    expect(verifyInviteToken(token, version, secret)).toBe(true);
    expect(verifyInviteToken(token, version, secret)).toBe(true);
  });
  it('rejeita assinatura adulterada, versão substituída e segredo fraco', () => {
    const token = createInviteToken(version, secret);
    expect(verifyInviteToken(`${token}x`, version, secret)).toBe(false);
    expect(verifyInviteToken(token, '239c5ba2-0795-481f-88ed-89c997cecf41', secret)).toBe(false);
    expect(() => createInviteToken(version, '')).toThrow();
  });
  it('persiste somente uma impressão irreversível do comprovante de cadastro', () => {
    expect(hashEnrollmentToken('synthetic-cookie')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashEnrollmentToken('synthetic-cookie')).not.toBe(hashEnrollmentToken('another-cookie'));
  });
});
