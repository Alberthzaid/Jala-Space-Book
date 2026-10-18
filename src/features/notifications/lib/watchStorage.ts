import { isValidWorkId } from '@/shared/api/openLibrary';

export const WATCH_STORAGE_KEY = 'bookspace.notifications.watchedOnLoan';

export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadWatchedOnLoan(storage: KeyValueStorage | null): Set<string> {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(WATCH_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && isValidWorkId(id)));
  } catch {
    return new Set();
  }
}

export function saveWatchedOnLoan(storage: KeyValueStorage | null, workIds: readonly string[]): void {
  try {
    storage?.setItem(WATCH_STORAGE_KEY, JSON.stringify(workIds));
  } catch {
  }
}
