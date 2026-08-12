import { auth } from '@/lib/auth/server';

const { GET: neonGet, POST: neonPost } = auth.handler();

const ALLOWED_GET_PATHS = new Set([
  'get-session',
  'get-access-token',
  'list-sessions',
  'token',
  'jwt',
]);

const ALLOWED_POST_PATHS = new Set([
  'sign-in/email',
  'sign-out',
  'revoke-session',
  'revoke-sessions',
  'revoke-all-sessions',
  'refresh-token',
  'change-password',
  'send-verification-email',
  'verify-email',
  'reset-password',
  'request-password-reset',
]);

function unavailable() {
  return Response.json({ erro: 'Rota de autenticação indisponível.' }, { status: 404 });
}

function canonicalizePath(path: string[]) {
  if (path.length === 0) {
    return null;
  }

  const canonicalSegments: string[] = [];

  for (const segment of path) {
    let decoded = segment;

    try {
      for (let round = 0; round < 5; round += 1) {
        const next = decodeURIComponent(decoded);

        if (next === decoded) {
          break;
        }

        decoded = next;
      }
    } catch {
      return null;
    }

    if (!/^[a-z0-9-]+$/.test(decoded)) {
      return null;
    }

    canonicalSegments.push(decoded);
  }

  return canonicalSegments.join('/');
}

export async function GET(
  request: Parameters<typeof neonGet>[0],
  context: Parameters<typeof neonGet>[1],
) {
  const canonicalPath = canonicalizePath((await context.params).path);

  if (!canonicalPath || !ALLOWED_GET_PATHS.has(canonicalPath)) {
    return unavailable();
  }

  return neonGet(request, {
    ...context,
    params: Promise.resolve({ path: canonicalPath.split('/') }),
  });
}

export async function POST(
  request: Parameters<typeof neonPost>[0],
  context: Parameters<typeof neonPost>[1],
) {
  const canonicalPath = canonicalizePath((await context.params).path);

  if (!canonicalPath || !ALLOWED_POST_PATHS.has(canonicalPath)) {
    return unavailable();
  }

  return neonPost(request, {
    ...context,
    params: Promise.resolve({ path: canonicalPath.split('/') }),
  });
}
