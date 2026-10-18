import { describe, expect, it } from 'vitest';

import type { ReadingListEntry } from '../types';
import { READING_LIST_STORAGE_KEY, loadReadingList, saveReadingList } from './readingListStorage';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

const ENTRIES: ReadingListEntry[] = [{ book: { id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'] }, status: 'reading' }];

describe('loadReadingList', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(loadReadingList(memoryStorage())).toEqual([]);
  });

  it('returns an empty list when storage is unavailable', () => {
    expect(loadReadingList(undefined)).toEqual([]);
  });

  it('parses stored entries', () => {
    const storage = memoryStorage({ [READING_LIST_STORAGE_KEY]: JSON.stringify(ENTRIES) });

    expect(loadReadingList(storage)).toEqual(ENTRIES);
  });

  it('returns an empty list for corrupt JSON', () => {
    expect(loadReadingList(memoryStorage({ [READING_LIST_STORAGE_KEY]: '{not json' }))).toEqual([]);
  });

  it('returns an empty list when reading throws', () => {
    expect(loadReadingList(throwingStorage)).toEqual([]);
  });
});

describe('saveReadingList', () => {
  it('writes the entries as JSON and reports success', () => {
    const storage = memoryStorage();

    expect(saveReadingList(storage, ENTRIES)).toBe(true);
    expect(JSON.parse(storage.data[READING_LIST_STORAGE_KEY] ?? 'null')).toEqual(ENTRIES);
  });

  it('reports failure instead of throwing when writing fails', () => {
    expect(saveReadingList(throwingStorage, ENTRIES)).toBe(false);
  });

  it('reports failure when storage is unavailable', () => {
    expect(saveReadingList(undefined, ENTRIES)).toBe(false);
  });
});
