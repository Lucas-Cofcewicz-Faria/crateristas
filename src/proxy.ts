import { auth } from '@/lib/auth/server';

export default auth.middleware({ loginUrl: '/entrar' });

export const config = {
  matcher: ['/painel/:path*', '/visitas/:path*'],
};
