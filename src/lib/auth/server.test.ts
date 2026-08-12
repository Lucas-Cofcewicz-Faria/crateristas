import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@neondatabase/auth/next/server', () => ({
  createNeonAuth: vi.fn(),
}));

import { AuthConfigurationError, auth, readNeonAuthConfig } from './server';

describe('configuração do Neon Auth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exige a URL base do Neon Auth', () => {
    expect(() =>
      readNeonAuthConfig({
        NEON_AUTH_COOKIE_SECRET: 'segredo-com-pelo-menos-trinta-e-dois-caracteres',
      }),
    ).toThrow(AuthConfigurationError);
  });

  it('exige o segredo usado para assinar os cookies', () => {
    expect(() =>
      readNeonAuthConfig({
        NEON_AUTH_BASE_URL: 'https://exemplo.neonauth.example/neondb/auth',
      }),
    ).toThrow(AuthConfigurationError);
  });

  it('rejeita um segredo com menos de 32 caracteres', () => {
    expect(() =>
      readNeonAuthConfig({
        NEON_AUTH_BASE_URL: 'https://exemplo.neonauth.example/neondb/auth',
        NEON_AUTH_COOKIE_SECRET: 'segredo-curto',
      }),
    ).toThrow(AuthConfigurationError);
  });

  it('produz a configuração explícita exigida pelo SDK', () => {
    expect(
      readNeonAuthConfig({
        NEON_AUTH_BASE_URL: 'https://exemplo.neonauth.example/neondb/auth',
        NEON_AUTH_COOKIE_SECRET: '12345678901234567890123456789012',
      }),
    ).toEqual({
      baseUrl: 'https://exemplo.neonauth.example/neondb/auth',
      cookies: { secret: '12345678901234567890123456789012' },
    });
  });

  it('adianta a criação do cliente até uma operação de runtime', () => {
    vi.stubEnv('NEON_AUTH_BASE_URL', '');
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', '');

    expect(() => auth.getSession()).toThrow(AuthConfigurationError);
  });
});
