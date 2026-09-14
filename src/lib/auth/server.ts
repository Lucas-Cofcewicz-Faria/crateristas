import { createNeonAuth } from '@neondatabase/auth/next/server';

type NeonAuth = ReturnType<typeof createNeonAuth>;
type AuthHandlers = ReturnType<NeonAuth['handler']>;
type RequestPasswordReset = (
  ...args: Parameters<NeonAuth['requestPasswordReset']>
) => ReturnType<NeonAuth['requestPasswordReset']>;
type ResetPassword = (
  ...args: Parameters<NeonAuth['resetPassword']>
) => ReturnType<NeonAuth['resetPassword']>;
type AuthFacade = Pick<
  NeonAuth,
  | 'getSession'
  | 'signOut'
  | 'handler'
  | 'middleware'
> & {
  requestPasswordReset: RequestPasswordReset;
  resetPassword: ResetPassword;
  signIn: Pick<NeonAuth['signIn'], 'email'>;
  signUp: Pick<NeonAuth['signUp'], 'email'>;
};
interface AuthEnvironment {
  [key: string]: string | undefined;
  NEON_AUTH_BASE_URL?: string;
  NEON_AUTH_COOKIE_SECRET?: string;
}

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

export function readNeonAuthConfig(environment: AuthEnvironment) {
  const baseUrl = environment.NEON_AUTH_BASE_URL?.trim();
  const secret = environment.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl) {
    throw new AuthConfigurationError('NEON_AUTH_BASE_URL não configurada.');
  }

  if (!secret) {
    throw new AuthConfigurationError('NEON_AUTH_COOKIE_SECRET não configurada.');
  }

  if (secret.length < 32) {
    throw new AuthConfigurationError(
      'NEON_AUTH_COOKIE_SECRET deve ter pelo menos 32 caracteres.',
    );
  }

  return {
    baseUrl,
    cookies: { secret },
  };
}

let singleton: NeonAuth | undefined;

function getNeonAuth(): NeonAuth {
  singleton ??= createNeonAuth(readNeonAuthConfig(process.env));
  return singleton;
}

const lazyGetSession: NeonAuth['getSession'] = (...args) => getNeonAuth().getSession(...args);

const lazySignInEmail: NeonAuth['signIn']['email'] = (...args) =>
  getNeonAuth().signIn.email(...args);

const lazySignUpEmail: NeonAuth['signUp']['email'] = (...args) =>
  getNeonAuth().signUp.email(...args);

const lazyRequestPasswordReset: RequestPasswordReset = (...args) =>
  getNeonAuth().requestPasswordReset(...args);

const lazyResetPassword: ResetPassword = (...args) =>
  getNeonAuth().resetPassword(...args);

const lazySignOut: NeonAuth['signOut'] = (...args) => getNeonAuth().signOut(...args);

const lazyHandler: NeonAuth['handler'] = () => ({
  GET: (...args: Parameters<AuthHandlers['GET']>) => getNeonAuth().handler().GET(...args),
  POST: (...args: Parameters<AuthHandlers['POST']>) => getNeonAuth().handler().POST(...args),
  PUT: (...args: Parameters<AuthHandlers['PUT']>) => getNeonAuth().handler().PUT(...args),
  DELETE: (...args: Parameters<AuthHandlers['DELETE']>) =>
    getNeonAuth().handler().DELETE(...args),
  PATCH: (...args: Parameters<AuthHandlers['PATCH']>) => getNeonAuth().handler().PATCH(...args),
});

const lazyMiddleware: NeonAuth['middleware'] = (middlewareConfig) => {
  return (request) => getNeonAuth().middleware(middlewareConfig)(request);
};

/**
 * Fachada singleton do Neon Auth. A instância real só é criada no primeiro uso
 * em runtime, permitindo testes e builds sem credenciais; qualquer operação
 * continua falhando imediatamente quando a configuração obrigatória é inválida.
 * A superfície fica restrita aos métodos usados pelo aplicativo.
 */
export const auth = Object.freeze({
  getSession: lazyGetSession,
  requestPasswordReset: lazyRequestPasswordReset,
  resetPassword: lazyResetPassword,
  signIn: Object.freeze({
    email: lazySignInEmail,
  }),
  signUp: Object.freeze({ email: lazySignUpEmail }),
  signOut: lazySignOut,
  handler: lazyHandler,
  middleware: lazyMiddleware,
}) satisfies AuthFacade;
