export const DEFAULT_OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AppEnv {
  openLibraryBaseUrl: string;
  supabase: SupabaseConfig | null;
  supabaseIssues: string[];
}

type RawEnv = Readonly<Record<string, string | boolean | undefined>>;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function readString(raw: RawEnv, key: string): string {
  const value = raw[key];
  return typeof value === 'string' ? value.trim() : '';
}

function parseUrl(value: string, allowLocalHttp: boolean): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const isHttps = url.protocol === 'https:';
    const isLocalHttp = allowLocalHttp && url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname);
    if (!isHttps && !isLocalHttp) return null;
    return value.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function parseEnv(raw: RawEnv): AppEnv {
  const openLibraryBaseUrl =
    parseUrl(readString(raw, 'VITE_OPEN_LIBRARY_BASE_URL'), false) ?? DEFAULT_OPEN_LIBRARY_BASE_URL;

  const supabaseUrl = parseUrl(readString(raw, 'VITE_SUPABASE_URL'), true);
  const anonKey = readString(raw, 'VITE_SUPABASE_ANON_KEY');
  const supabaseIssues = [
    ...(supabaseUrl ? [] : ['VITE_SUPABASE_URL']),
    ...(anonKey ? [] : ['VITE_SUPABASE_ANON_KEY']),
  ];

  return {
    openLibraryBaseUrl,
    supabase: supabaseUrl && anonKey ? { url: supabaseUrl, anonKey } : null,
    supabaseIssues,
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
