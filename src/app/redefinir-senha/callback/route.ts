import { type NextRequest, NextResponse } from 'next/server';
import {
  PASSWORD_RESET_COOKIE,
  PASSWORD_RESET_COOKIE_MAX_AGE_SECONDS,
} from '@/lib/auth/password-reset';

const MAX_RESET_TOKEN_LENGTH = 4096;

function redirectWithoutReferrer(request: NextRequest, invalid: boolean) {
  const destination = new URL('/redefinir-senha', request.url);
  if (invalid) destination.searchParams.set('erro', 'link');

  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get('token');
  const hasProviderError = request.nextUrl.searchParams.has('error');
  const invalid = hasProviderError
    || !token
    || token.length > MAX_RESET_TOKEN_LENGTH;
  const response = redirectWithoutReferrer(request, invalid);

  if (!invalid && token) {
    response.cookies.set(PASSWORD_RESET_COOKIE, token, {
      httpOnly: true,
      maxAge: PASSWORD_RESET_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    });
  }

  return response;
}
