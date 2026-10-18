import { describe, expect, it } from 'vitest';

import {
  hasErrors,
  normalizeDisplayName,
  normalizeEmail,
  validateDisplayName,
  validateEmail,
  validateLoginForm,
  validatePassword,
  validatePasswordConfirmation,
  validateRegisterForm,
} from './validation';

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('')).toBe('Ingresa tu correo electrónico.');
    expect(validateEmail('   ')).toBe('Ingresa tu correo electrónico.');
  });

  it('rejects malformed addresses', () => {
    expect(validateEmail('ana')).toBe('Ingresa un correo electrónico válido.');
    expect(validateEmail('ana@example')).toBe('Ingresa un correo electrónico válido.');
    expect(validateEmail('ana @example.com')).toBe('Ingresa un correo electrónico válido.');
  });

  it('rejects addresses that are too long', () => {
    expect(validateEmail(`${'a'.repeat(250)}@x.com`)).toBe('El correo es demasiado largo.');
  });

  it('accepts a valid address with surrounding spaces', () => {
    expect(validateEmail(' Ana@Example.com ')).toBeUndefined();
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail(' Ana@Example.COM ')).toBe('ana@example.com');
  });
});

describe('validatePassword', () => {
  it('requires a value', () => {
    expect(validatePassword('')).toBe('Ingresa una contraseña.');
  });

  it('requires at least 8 characters', () => {
    expect(validatePassword('abc1')).toBe('La contraseña debe tener al menos 8 caracteres.');
  });

  it('requires a letter and a number', () => {
    expect(validatePassword('abcdefgh')).toBe('La contraseña debe incluir al menos una letra y un número.');
    expect(validatePassword('12345678')).toBe('La contraseña debe incluir al menos una letra y un número.');
  });

  it('limits the length to 72 characters', () => {
    expect(validatePassword('a1'.repeat(37))).toBe('La contraseña no puede superar los 72 caracteres.');
  });

  it('accepts a strong password, including non-ASCII letters', () => {
    expect(validatePassword('secreto123')).toBeUndefined();
    expect(validatePassword('contraseña1')).toBeUndefined();
  });
});

describe('validatePasswordConfirmation', () => {
  it('requires the confirmation', () => {
    expect(validatePasswordConfirmation('secreto123', '')).toBe('Confirma tu contraseña.');
  });

  it('requires both values to match', () => {
    expect(validatePasswordConfirmation('secreto123', 'secreto124')).toBe('Las contraseñas no coinciden.');
    expect(validatePasswordConfirmation('secreto123', 'secreto123')).toBeUndefined();
  });
});

describe('validateDisplayName', () => {
  it('requires a value', () => {
    expect(validateDisplayName('  ')).toBe('Ingresa tu nombre.');
  });

  it('enforces the length limits after trimming', () => {
    expect(validateDisplayName(' A ')).toBe('El nombre debe tener al menos 2 caracteres.');
    expect(validateDisplayName('x'.repeat(51))).toBe('El nombre no puede superar los 50 caracteres.');
  });

  it('rejects markup and control characters', () => {
    expect(validateDisplayName('<script>')).toBe('El nombre contiene caracteres no permitidos.');
    expect(validateDisplayName('Ana\u0007')).toBe('El nombre contiene caracteres no permitidos.');
  });

  it('accepts a regular name', () => {
    expect(validateDisplayName('  Ana María ')).toBeUndefined();
  });
});

describe('normalizeDisplayName', () => {
  it('trims and collapses inner whitespace', () => {
    expect(normalizeDisplayName('  Ana   María ')).toBe('Ana María');
  });
});

describe('validateLoginForm', () => {
  it('only checks that both fields are filled and the email is valid', () => {
    expect(validateLoginForm({ email: '', password: '' })).toEqual({
      email: 'Ingresa tu correo electrónico.',
      password: 'Ingresa tu contraseña.',
    });
    expect(validateLoginForm({ email: 'ana@example.com', password: 'x' })).toEqual({});
  });
});

describe('validateRegisterForm', () => {
  it('returns no errors for valid data', () => {
    expect(
      validateRegisterForm({
        displayName: 'Ana',
        email: 'ana@example.com',
        password: 'secreto123',
        confirmPassword: 'secreto123',
      })
    ).toEqual({});
  });

  it('returns an error per invalid field', () => {
    const errors = validateRegisterForm({ displayName: '', email: 'x', password: 'short', confirmPassword: 'other' });
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'displayName', 'email', 'password']);
  });
});

describe('hasErrors', () => {
  it('detects whether any field has an error', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: undefined })).toBe(false);
    expect(hasErrors({ email: 'Error' })).toBe(true);
  });
});
