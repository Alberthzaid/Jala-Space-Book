import { HOME_PATH, LOGIN_PATH, REGISTER_PATH } from '@/shared/lib/paths';

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const AUTH_PATHS = [LOGIN_PATH, REGISTER_PATH];

export function getSafeRedirect(target: string | null | undefined, fallback: string = HOME_PATH): string {
  if (!target || !target.startsWith('/')) return fallback;
  if (target.startsWith('//') || target.includes('\\') || CONTROL_CHARS.test(target)) return fallback;
  const pathname = target.split(/[?#]/)[0] ?? '';
  if (AUTH_PATHS.includes(pathname)) return fallback;
  return target;
}

export function buildLoginPath(next: string): string {
  const safe = getSafeRedirect(next);
  return safe === HOME_PATH ? LOGIN_PATH : `${LOGIN_PATH}?${new URLSearchParams({ next: safe }).toString()}`;
}
