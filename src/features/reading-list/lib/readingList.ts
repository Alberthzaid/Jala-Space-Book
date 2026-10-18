import type { ReadingListAction, ReadingListEntry, ReadingStatus, SavedBook } from '../types';

export const READING_STATUSES: readonly ReadingStatus[] = ['want', 'reading', 'read'];

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  want: 'Quiero leer',
  reading: 'Leyendo',
  read: 'Leído',
};

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return READING_STATUSES.some((status) => status === value);
}

export function toSavedBook(book: SavedBook): SavedBook {
  const saved: SavedBook = { id: book.id, title: book.title, authors: [...book.authors] };
  if (book.year !== undefined) saved.year = book.year;
  if (book.coverId !== undefined) saved.coverId = book.coverId;
  return saved;
}

export function readingListReducer(state: ReadingListEntry[], action: ReadingListAction): ReadingListEntry[] {
  switch (action.type) {
    case 'add': {
      if (state.some((entry) => entry.book.id === action.book.id)) return state;
      return [{ book: toSavedBook(action.book), status: 'want' }, ...state];
    }
    case 'setStatus': {
      const exists = state.some((entry) => entry.book.id === action.book.id);
      if (!exists) return [{ book: toSavedBook(action.book), status: action.status }, ...state];
      return state.map((entry) => (entry.book.id === action.book.id ? { ...entry, status: action.status } : entry));
    }
    case 'remove': {
      const next = state.filter((entry) => entry.book.id !== action.id);
      return next.length === state.length ? state : next;
    }
  }
}

export function countByStatus(entries: readonly ReadingListEntry[]): Record<ReadingStatus, number> {
  const counts: Record<ReadingStatus, number> = { want: 0, reading: 0, read: 0 };
  entries.forEach((entry) => {
    counts[entry.status] += 1;
  });
  return counts;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseSavedBook(raw: unknown): SavedBook | undefined {
  if (!isRecord(raw)) return undefined;
  const { id, title, authors, year, coverId } = raw;
  if (typeof id !== 'string' || !id || typeof title !== 'string' || !Array.isArray(authors)) return undefined;

  const book: SavedBook = {
    id,
    title,
    authors: authors.filter((author): author is string => typeof author === 'string'),
  };
  if (typeof year === 'number') book.year = year;
  if (typeof coverId === 'number') book.coverId = coverId;
  return book;
}

export function parseReadingList(raw: unknown): ReadingListEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const entries: ReadingListEntry[] = [];
  raw.forEach((item) => {
    if (!isRecord(item) || !isReadingStatus(item.status)) return;
    const book = parseSavedBook(item.book);
    if (!book || seen.has(book.id)) return;
    seen.add(book.id);
    entries.push({ book, status: item.status });
  });
  return entries;
}
