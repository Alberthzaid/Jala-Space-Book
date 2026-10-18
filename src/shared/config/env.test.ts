import { describe, expect, it } from 'vitest';

import { DEFAULT_OPEN_LIBRARY_BASE_URL, parseEnv } from './env';

describe('parseEnv', () => {
  it('falls back to the public Open Library url when it is missing', () => {
    expect(parseEnv({}).openLibraryBaseUrl).toBe(DEFAULT_OPEN_LIBRARY_BASE_URL);
    expect(DEFAULT_OPEN_LIBRARY_BASE_URL).toBe('https://openlibrary.org');
  });

  it('reads the Open Library url and strips trailing slashes', () => {
    expect(parseEnv({ VITE_OPEN_LIBRARY_BASE_URL: ' https://openlibrary.org/ ' }).openLibraryBaseUrl).toBe(
      'https://openlibrary.org'
    );
  });

  it('ignores Open Library urls that are not https', () => {
    expect(parseEnv({ VITE_OPEN_LIBRARY_BASE_URL: 'http://openlibrary.org' }).openLibraryBaseUrl).toBe(
      DEFAULT_OPEN_LIBRARY_BASE_URL
    );
    expect(parseEnv({ VITE_OPEN_LIBRARY_BASE_URL: 'not a url' }).openLibraryBaseUrl).toBe(DEFAULT_OPEN_LIBRARY_BASE_URL);
  });

  it('returns the Supabase config when url and key are valid', () => {
    const env = parseEnv({ VITE_SUPABASE_URL: ' https://abc.supabase.co/ ', VITE_SUPABASE_ANON_KEY: ' public-key ' });
    expect(env.supabase).toEqual({ url: 'https://abc.supabase.co', anonKey: 'public-key' });
    expect(env.supabaseIssues).toEqual([]);
  });

  it('reports every missing Supabase variable', () => {
    const env = parseEnv({});
    expect(env.supabase).toBeNull();
    expect(env.supabaseIssues).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
  });

  it('treats blank values as missing', () => {
    const env = parseEnv({ VITE_SUPABASE_URL: '   ', VITE_SUPABASE_ANON_KEY: 'key' });
    expect(env.supabase).toBeNull();
    expect(env.supabaseIssues).toEqual(['VITE_SUPABASE_URL']);
  });

  it('rejects a Supabase url that is not https', () => {
    const env = parseEnv({ VITE_SUPABASE_URL: 'http://abc.supabase.co', VITE_SUPABASE_ANON_KEY: 'key' });
    expect(env.supabase).toBeNull();
    expect(env.supabaseIssues).toEqual(['VITE_SUPABASE_URL']);
  });

  it('allows http only for a local Supabase instance', () => {
    const env = parseEnv({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_ANON_KEY: 'key' });
    expect(env.supabase).toEqual({ url: 'http://127.0.0.1:54321', anonKey: 'key' });
  });
});
