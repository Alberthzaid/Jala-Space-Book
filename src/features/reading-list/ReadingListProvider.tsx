import { createContext, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { readingListReducer } from './lib/readingList';
import { getBrowserStorage, loadReadingList, saveReadingList } from './lib/readingListStorage';
import type { ReadingListEntry, ReadingStatus, SavedBook } from './types';

export interface ReadingListContextValue {
  entries: readonly ReadingListEntry[];
  count: number;
  getStatus: (bookId: string) => ReadingStatus | undefined;
  add: (book: SavedBook) => void;
  setStatus: (book: SavedBook, status: ReadingStatus) => void;
  remove: (bookId: string) => void;
}

export const ReadingListContext = createContext<ReadingListContextValue | null>(null);

export default function ReadingListProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(readingListReducer, undefined, () => loadReadingList(getBrowserStorage()));

  useEffect(() => {
    saveReadingList(getBrowserStorage(), entries);
  }, [entries]);

  const getStatus = useCallback(
    (bookId: string) => entries.find((entry) => entry.book.id === bookId)?.status,
    [entries]
  );
  const add = useCallback((book: SavedBook) => dispatch({ type: 'add', book }), []);
  const setStatus = useCallback(
    (book: SavedBook, status: ReadingStatus) => dispatch({ type: 'setStatus', book, status }),
    []
  );
  const remove = useCallback((bookId: string) => dispatch({ type: 'remove', id: bookId }), []);

  const value = useMemo<ReadingListContextValue>(
    () => ({ entries, count: entries.length, getStatus, add, setStatus, remove }),
    [entries, getStatus, add, setStatus, remove]
  );

  return <ReadingListContext.Provider value={value}>{children}</ReadingListContext.Provider>;
}
