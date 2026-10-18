import { describe, expect, it } from 'vitest';

import { mapAuthError } from './authErrors';

describe('mapAuthError', () => {
  it('maps invalid credentials', () => {
    expect(mapAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'Correo o contraseña incorrectos.'
    );
    expect(mapAuthError({ message: 'Invalid login credentials' })).toBe('Correo o contraseña incorrectos.');
  });

  it('maps an existing account', () => {
    expect(mapAuthError({ code: 'user_already_exists', message: 'User already registered' })).toBe(
      'Ya existe una cuenta con este correo.'
    );
    expect(mapAuthError({ message: 'User already registered' })).toBe('Ya existe una cuenta con este correo.');
  });

  it('maps an unconfirmed email', () => {
    expect(mapAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' })).toBe(
      'Debes confirmar tu correo antes de iniciar sesión.'
    );
  });

  it('maps a weak password', () => {
    expect(mapAuthError({ code: 'weak_password', message: 'Password should be at least 6 characters' })).toBe(
      'La contraseña es demasiado débil.'
    );
  });

  it('maps rate limiting', () => {
    expect(mapAuthError({ code: 'over_request_rate_limit', message: 'x' })).toBe(
      'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
    );
    expect(mapAuthError({ status: 429, message: 'Too many requests' })).toBe(
      'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
    );
  });

  it('maps network failures', () => {
    expect(mapAuthError(new TypeError('Failed to fetch'))).toBe(
      'No pudimos conectar con el servidor. Revisa tu conexión.'
    );
  });

  it('falls back to a generic message', () => {
    expect(mapAuthError({ message: 'Something odd' })).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    expect(mapAuthError(undefined)).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
  });
});
