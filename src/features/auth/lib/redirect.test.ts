import { describe, expect, it } from 'vitest';

import { buildLoginPath, getSafeRedirect } from './redirect';

describe('getSafeRedirect', () => {
  it('keeps internal paths, including query and hash', () => {
    expect(getSafeRedirect('/prestamos')).toBe('/prestamos');
    expect(getSafeRedirect('/libro/OL1W?tab=1#top')).toBe('/libro/OL1W?tab=1#top');
  });

  it('falls back to home when there is no target', () => {
    expect(getSafeRedirect(null)).toBe('/');
    expect(getSafeRedirect(undefined)).toBe('/');
    expect(getSafeRedirect('')).toBe('/');
  });

  it('rejects external and protocol-relative targets (open redirect)', () => {
    expect(getSafeRedirect('//evil.com')).toBe('/');
    expect(getSafeRedirect('https://evil.com')).toBe('/');
    expect(getSafeRedirect('/\\evil.com')).toBe('/');
    expect(getSafeRedirect('\\\\evil.com')).toBe('/');
    expect(getSafeRedirect('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirect('evil.com/path')).toBe('/');
  });

  it('rejects control characters', () => {
    expect(getSafeRedirect('/ok\n//evil.com')).toBe('/');
    expect(getSafeRedirect('/\t/evil.com')).toBe('/');
  });

  it('does not redirect back to the auth screens', () => {
    expect(getSafeRedirect('/login?next=/x')).toBe('/');
    expect(getSafeRedirect('/registro')).toBe('/');
  });

  it('uses the provided fallback', () => {
    expect(getSafeRedirect('//x', '/catalogo')).toBe('/catalogo');
  });
});

describe('buildLoginPath', () => {
  it('encodes the target in the next parameter', () => {
    expect(buildLoginPath('/prestamos?tab=historial')).toBe('/login?next=%2Fprestamos%3Ftab%3Dhistorial');
  });

  it('omits the parameter for home or unsafe targets', () => {
    expect(buildLoginPath('/')).toBe('/login');
    expect(buildLoginPath('//evil.com')).toBe('/login');
  });
});
