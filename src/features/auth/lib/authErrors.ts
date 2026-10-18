const GENERIC_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
const NETWORK_MESSAGE = 'No pudimos conectar con el servidor. Revisa tu conexión.';
const RATE_LIMIT_MESSAGE = 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';

const MESSAGES_BY_CODE: Readonly<Record<string, string>> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con este correo.',
  email_exists: 'Ya existe una cuenta con este correo.',
  email_not_confirmed: 'Debes confirmar tu correo antes de iniciar sesión.',
  weak_password: 'La contraseña es demasiado débil.',
  over_request_rate_limit: RATE_LIMIT_MESSAGE,
  over_email_send_rate_limit: RATE_LIMIT_MESSAGE,
  signup_disabled: 'El registro de nuevas cuentas está deshabilitado.',
  email_address_invalid: 'Ingresa un correo electrónico válido.',
};

const MESSAGES_BY_TEXT: readonly [RegExp, string][] = [
  [/invalid login credentials/i, MESSAGES_BY_CODE.invalid_credentials!],
  [/already registered|already exists/i, MESSAGES_BY_CODE.user_already_exists!],
  [/email not confirmed/i, MESSAGES_BY_CODE.email_not_confirmed!],
  [/failed to fetch|network/i, NETWORK_MESSAGE],
];

function readField(error: unknown, field: string): unknown {
  return error !== null && typeof error === 'object' && field in error
    ? (error as Record<string, unknown>)[field]
    : undefined;
}

export function mapAuthError(error: unknown): string {
  const code = readField(error, 'code');
  if (typeof code === 'string' && MESSAGES_BY_CODE[code]) return MESSAGES_BY_CODE[code];
  if (readField(error, 'status') === 429) return RATE_LIMIT_MESSAGE;

  const message = readField(error, 'message');
  if (typeof message === 'string') {
    const match = MESSAGES_BY_TEXT.find(([pattern]) => pattern.test(message));
    if (match) return match[1];
  }
  return GENERIC_MESSAGE;
}
