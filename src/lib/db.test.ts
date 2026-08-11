import { afterEach, expect, test, vi } from 'vitest';

const { neon } = vi.hoisted(() => ({
  neon: vi.fn((url: string) => ({ url })),
}));

vi.mock('@neondatabase/serverless', () => ({ neon }));

import { getDb } from './db';

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
  neon.mockClear();
});

test('rejects database access when DATABASE_URL is not configured', () => {
  delete process.env.DATABASE_URL;

  expect(() => getDb()).toThrow('DATABASE_URL não configurada.');
});

test('creates a Neon client only after DATABASE_URL is configured', () => {
  process.env.DATABASE_URL = 'postgresql://test.example/database';

  expect(getDb()).toEqual({ url: 'postgresql://test.example/database' });
});
