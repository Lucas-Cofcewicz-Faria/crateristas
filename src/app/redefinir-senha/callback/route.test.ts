import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('callback de redefinição de senha', () => {
  it('troca o token da URL por um cookie HttpOnly temporário', async () => {
    const response = await GET(new NextRequest(
      'https://crateristas.example/redefinir-senha/callback?token=token-secreto',
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://crateristas.example/redefinir-senha',
    );
    expect(response.headers.get('location')).not.toContain('token-secreto');
    expect(response.headers.get('set-cookie')).toContain(
      'crateristas.password-reset=token-secreto',
    );
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=strict');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=900');
    expect(response.headers.get('set-cookie')).toContain('Secure');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each([
    ['token ausente', 'http://localhost/redefinir-senha/callback'],
    ['erro do Neon', 'http://localhost/redefinir-senha/callback?error=INVALID_TOKEN'],
    ['token grande demais', `http://localhost/redefinir-senha/callback?token=${'a'.repeat(4097)}`],
  ])('redireciona %s sem gravar credencial', async (_case, url) => {
    const response = await GET(new NextRequest(url));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/redefinir-senha?erro=link',
    );
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
