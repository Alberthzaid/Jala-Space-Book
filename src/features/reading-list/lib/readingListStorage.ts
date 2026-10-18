import type { ReadingListEntry } from '../types';
import { parseReadingList } from './readingList';

export const READING_LIST_STORAGE_KEY = 'bookspace.reading-list.v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function getBrowserStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function loadReadingList(storage: StorageLike | undefined): ReadingListEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(READING_LIST_STORAGE_KEY);
    return raw ? parseReadingList(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveReadingList(storage: StorageLike | undefined, entries: readonly ReadingListEntry[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(READING_LIST_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}
