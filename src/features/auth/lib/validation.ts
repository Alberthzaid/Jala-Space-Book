export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const EMAIL_MAX_LENGTH = 254;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETTER_PATTERN = /\p{L}/u;
const DIGIT_PATTERN = /\d/;
const FORBIDDEN_NAME_PATTERN = /[<>{}\u0000-\u001F\u007F-\u009F]/;

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return 'Ingresa tu correo electrónico.';
  if (email.length > EMAIL_MAX_LENGTH) return 'El correo es demasiado largo.';
  if (!EMAIL_PATTERN.test(email)) return 'Ingresa un correo electrónico válido.';
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Ingresa una contraseña.';
  if (value.length < PASSWORD_MIN_LENGTH) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (value.length > PASSWORD_MAX_LENGTH) return `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`;
  if (!LETTER_PATTERN.test(value) || !DIGIT_PATTERN.test(value)) {
    return 'La contraseña debe incluir al menos una letra y un número.';
  }
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return 'Confirma tu contraseña.';
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return undefined;
}

export function validateDisplayName(value: string): string | undefined {
  const name = normalizeDisplayName(value);
  if (!name) return 'Ingresa tu nombre.';
  if (FORBIDDEN_NAME_PATTERN.test(value)) return 'El nombre contiene caracteres no permitidos.';
  if (name.length < DISPLAY_NAME_MIN_LENGTH) return `El nombre debe tener al menos ${DISPLAY_NAME_MIN_LENGTH} caracteres.`;
  if (name.length > DISPLAY_NAME_MAX_LENGTH) return `El nombre no puede superar los ${DISPLAY_NAME_MAX_LENGTH} caracteres.`;
  return undefined;
}

function compact<Field extends string>(errors: Record<Field, string | undefined>): FieldErrors<Field> {
  const result: FieldErrors<Field> = {};
  for (const key of Object.keys(errors) as Field[]) {
    const message = errors[key];
    if (message) result[key] = message;
  }
  return result;
}

export function validateLoginForm(values: LoginFormValues): FieldErrors<keyof LoginFormValues> {
  return compact({
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Ingresa tu contraseña.',
  });
}

export function validateRegisterForm(values: RegisterFormValues): FieldErrors<keyof RegisterFormValues> {
  return compact({
    displayName: validateDisplayName(values.displayName),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword: validatePasswordConfirmation(values.password, values.confirmPassword),
  });
}

export function hasErrors(errors: Readonly<Record<string, string | undefined>>): boolean {
  return Object.values(errors).some(Boolean);
}
