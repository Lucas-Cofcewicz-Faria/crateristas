export const LOGIN_ERROR_MESSAGE = 'E-mail ou senha inválidos.' as const;
export const PASSWORD_RESET_SENT_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos um link para definir uma nova senha.' as const;
export const PASSWORD_RESET_REQUEST_ERROR_MESSAGE =
  'Não foi possível enviar o link agora. Tente novamente em instantes.' as const;
export const PASSWORD_RESET_INVALID_LINK_MESSAGE =
  'O link de redefinição é inválido ou expirou.' as const;
export const PASSWORD_MAX_LENGTH = 128;

export interface LoginState {
  error: typeof LOGIN_ERROR_MESSAGE | null;
}

export type LoginAction = (
  previousState: LoginState,
  formData: FormData,
) => Promise<LoginState>;

export const initialLoginState: LoginState = { error: null };

export interface PasswordResetState {
  status: 'idle' | 'sent' | 'error';
  message: string | null;
}

export type PasswordResetAction = (
  previousState: PasswordResetState,
  formData: FormData,
) => Promise<PasswordResetState>;

export const initialPasswordResetState: PasswordResetState = {
  status: 'idle',
  message: null,
};
