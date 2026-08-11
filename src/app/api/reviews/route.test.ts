import { afterEach, expect, test } from 'vitest';
import { GET, POST } from './route';

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

test('GET returns the route error response when DATABASE_URL is missing', async () => {
  delete process.env.DATABASE_URL;

  const response = await GET();

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    success: false,
    error: 'DATABASE_URL não configurada.',
  });
});

test('POST returns the route error response when DATABASE_URL is missing', async () => {
  delete process.env.DATABASE_URL;

  const response = await POST(new Request('http://localhost/api/reviews', { method: 'POST' }));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    success: false,
    error: 'DATABASE_URL não configurada.',
  });
});
