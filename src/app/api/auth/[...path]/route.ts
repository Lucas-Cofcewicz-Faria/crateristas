import { auth } from '@/lib/auth/server';

const { GET, POST: neonPost } = auth.handler();

export { GET };

export async function POST(
  request: Parameters<typeof neonPost>[0],
  context: Parameters<typeof neonPost>[1],
) {
  const { path } = await context.params;

  if (path[0] === 'sign-up') {
    return Response.json({ erro: 'Cadastro indisponível.' }, { status: 404 });
  }

  return neonPost(request, context);
}
