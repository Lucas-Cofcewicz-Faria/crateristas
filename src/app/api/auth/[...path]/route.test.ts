import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({
  auth: {
    handler: () => ({
      GET: async () => Response.json({ encaminhado: true }),
      POST: async () => Response.json({ encaminhado: true }),
    }),
  },
}));

import { POST } from './route';

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe('handler fechado do Neon Auth', () => {
  it('oculta o endpoint de cadastro por email', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/sign-up/email', { method: 'POST' }),
      context(['sign-up', 'email']),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ erro: 'Cadastro indisponível.' });
  });

  it('mantem os demais endpoints do handler funcionais', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/sign-in/email', { method: 'POST' }),
      context(['sign-in', 'email']),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ encaminhado: true });
  });
});
