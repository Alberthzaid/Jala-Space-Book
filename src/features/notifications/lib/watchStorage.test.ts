import { describe, expect, it } from 'vitest';

import { loadWatchedOnLoan, saveWatchedOnLoan, WATCH_STORAGE_KEY } from './watchStorage';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('watchStorage', () => {
  it('loads valid work ids only', () => {
    const storage = memoryStorage({ [WATCH_STORAGE_KEY]: JSON.stringify(['OL1W', 'bad', 3, 'OL2W']) });
    expect([...loadWatchedOnLoan(storage)]).toEqual(['OL1W', 'OL2W']);
  });

  it('returns an empty set for missing or corrupt data', () => {
    expect(loadWatchedOnLoan(memoryStorage()).size).toBe(0);
    expect(loadWatchedOnLoan(memoryStorage({ [WATCH_STORAGE_KEY]: '{oops' })).size).toBe(0);
    expect(loadWatchedOnLoan(null).size).toBe(0);
  });

  it('saves the ids as JSON', () => {
    const storage = memoryStorage();
    saveWatchedOnLoan(storage, ['OL1W']);
    expect(storage.data.get(WATCH_STORAGE_KEY)).toBe('["OL1W"]');
  });

  it('ignores storage errors', () => {
    const failing = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(loadWatchedOnLoan(failing).size).toBe(0);
    expect(() => saveWatchedOnLoan(failing, ['OL1W'])).not.toThrow();
  });
});
