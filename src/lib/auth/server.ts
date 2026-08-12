import { createNeonAuth } from '@neondatabase/auth/next/server';

type NeonAuth = ReturnType<typeof createNeonAuth>;
type AuthHandlers = ReturnType<NeonAuth['handler']>;
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

function bindAuthPath(path: PropertyKey[]): unknown {
  return new Proxy(
    function lazyAuthCall() {},
    {
      apply(_target, _thisArgument, argumentsList) {
        let receiver: unknown = getNeonAuth();

        for (const property of path.slice(0, -1)) {
          receiver = Reflect.get(Object(receiver), property);
        }

        const callable = Reflect.get(Object(receiver), path.at(-1)!);
        if (typeof callable !== 'function') {
          throw new TypeError('O método solicitado não existe no Neon Auth.');
        }

        return Reflect.apply(callable, receiver, argumentsList);
      },
      get(_target, property) {
        return bindAuthPath([...path, property]);
      },
    },
  );
}

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
 * Fachada singleton do Neon Auth. A instancia real só é criada no primeiro uso
 * em runtime, permitindo testes e builds sem credenciais; qualquer operação
 * continua falhando imediatamente quando a configuração obrigatória é inválida.
 */
export const auth = new Proxy({} as NeonAuth, {
  get(_target, property) {
    if (property === 'handler') return lazyHandler;
    if (property === 'middleware') return lazyMiddleware;
    return bindAuthPath([property]);
  },
});
