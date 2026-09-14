import { auth } from '@/lib/auth/server';

export default auth.middleware({ loginUrl: '/entrar' });

export const config = {
  matcher: ['/perfil/:path*', '/painel/:path*', '/visitas/:path*', '/restaurantes/:slug/menu/novo', '/restaurantes/:slug/menu/:itemSlug/avaliar'],
};
