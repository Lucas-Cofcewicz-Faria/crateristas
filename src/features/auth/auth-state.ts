export const LOGIN_ERROR_MESSAGE = 'E-mail ou senha inválidos.' as const;

export interface LoginState {
  error: typeof LOGIN_ERROR_MESSAGE | null;
}

export type LoginAction = (
  previousState: LoginState,
  formData: FormData,
) => Promise<LoginState>;

export const initialLoginState: LoginState = { error: null };
