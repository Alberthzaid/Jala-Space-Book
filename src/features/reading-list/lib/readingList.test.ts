import { describe, expect, it } from 'vitest';

import type { Book } from '@/shared/types/book';
import type { ReadingListEntry } from '../types';
import {
  READING_STATUS_LABELS,
  countByStatus,
  parseReadingList,
  readingListReducer,
  toSavedBook,
} from './readingList';

const HOBBIT: Book = {
  id: 'OL27482W',
  title: 'The Hobbit',
  authors: ['J.R.R. Tolkien'],
  year: 1937,
  coverId: 14627509,
  editionCount: 482,
  subjects: ['Fantasy'],
};

const DUNE: Book = { id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'] };

describe('toSavedBook', () => {
  it('keeps only the snapshot fields', () => {
    expect(toSavedBook(HOBBIT)).toEqual({
      id: 'OL27482W',
      title: 'The Hobbit',
      authors: ['J.R.R. Tolkien'],
      year: 1937,
      coverId: 14627509,
    });
  });

  it('does not add keys for missing optional fields', () => {
    expect(Object.keys(toSavedBook(DUNE))).toEqual(['id', 'title', 'authors']);
  });
});

describe('READING_STATUS_LABELS', () => {
  it('labels every status in Spanish', () => {
    expect(READING_STATUS_LABELS).toEqual({ want: 'Quiero leer', reading: 'Leyendo', read: 'Leído' });
  });
});

describe('readingListReducer', () => {
  it('adds a book with the "want" status at the top of the list', () => {
    const state = readingListReducer([], { type: 'add', book: DUNE });
    const next = readingListReducer(state, { type: 'add', book: HOBBIT });

    expect(next.map((entry) => entry.book.id)).toEqual(['OL27482W', 'OL1W']);
    expect(next[0]).toEqual({ book: toSavedBook(HOBBIT), status: 'want' });
  });

  it('does not duplicate a book that is already saved', () => {
    const state: ReadingListEntry[] = [{ book: toSavedBook(DUNE), status: 'reading' }];

    expect(readingListReducer(state, { type: 'add', book: DUNE })).toBe(state);
  });

  it('updates the status of a saved book in place', () => {
    const state: ReadingListEntry[] = [
      { book: toSavedBook(HOBBIT), status: 'want' },
      { book: toSavedBook(DUNE), status: 'want' },
    ];

    const next = readingListReducer(state, { type: 'setStatus', book: DUNE, status: 'read' });

    expect(next).toEqual([
      { book: toSavedBook(HOBBIT), status: 'want' },
      { book: toSavedBook(DUNE), status: 'read' },
    ]);
  });

  it('adds an unsaved book when its status is set', () => {
    const next = readingListReducer([], { type: 'setStatus', book: HOBBIT, status: 'reading' });

    expect(next).toEqual([{ book: toSavedBook(HOBBIT), status: 'reading' }]);
  });

  it('removes a book by id', () => {
    const state: ReadingListEntry[] = [
      { book: toSavedBook(HOBBIT), status: 'want' },
      { book: toSavedBook(DUNE), status: 'read' },
    ];

    expect(readingListReducer(state, { type: 'remove', id: 'OL27482W' })).toEqual([
      { book: toSavedBook(DUNE), status: 'read' },
    ]);
  });

  it('returns the same state when removing an unknown id', () => {
    const state: ReadingListEntry[] = [{ book: toSavedBook(DUNE), status: 'want' }];

    expect(readingListReducer(state, { type: 'remove', id: 'OL404W' })).toBe(state);
  });

  it('never mutates the previous state', () => {
    const state: ReadingListEntry[] = [{ book: toSavedBook(DUNE), status: 'want' }];
    const snapshot = structuredClone(state);

    readingListReducer(state, { type: 'setStatus', book: DUNE, status: 'read' });
    readingListReducer(state, { type: 'add', book: HOBBIT });
    readingListReducer(state, { type: 'remove', id: 'OL1W' });

    expect(state).toEqual(snapshot);
  });
});

describe('countByStatus', () => {
  it('counts entries per status', () => {
    const state: ReadingListEntry[] = [
      { book: toSavedBook(HOBBIT), status: 'want' },
      { book: toSavedBook(DUNE), status: 'want' },
      { book: { id: 'OL5W', title: 'X', authors: [] }, status: 'read' },
    ];

    expect(countByStatus(state)).toEqual({ want: 2, reading: 0, read: 1 });
  });
});

describe('parseReadingList', () => {
  it('keeps valid entries', () => {
    const raw = [{ book: { id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'], year: 1965, coverId: 7 }, status: 'read' }];

    expect(parseReadingList(raw)).toEqual(raw);
  });

  it('returns an empty list for non-array input', () => {
    expect(parseReadingList(null)).toEqual([]);
    expect(parseReadingList({ book: {} })).toEqual([]);
    expect(parseReadingList('[]')).toEqual([]);
  });

  it('drops malformed entries, unknown statuses and duplicates', () => {
    const raw = [
      { book: { id: 'OL1W', title: 'Dune', authors: [] }, status: 'want' },
      { book: { id: 'OL1W', title: 'Dune again', authors: [] }, status: 'read' },
      { book: { id: 'OL2W', title: 'No status', authors: [] } },
      { book: { id: 'OL3W', title: 'Bad status', authors: [] }, status: 'borrowed' },
      { book: { id: 'OL4W', authors: [] }, status: 'want' },
      { book: { id: 'OL5W', title: 'Bad authors', authors: 'x' }, status: 'want' },
      42,
    ];

    expect(parseReadingList(raw)).toEqual([{ book: { id: 'OL1W', title: 'Dune', authors: [] }, status: 'want' }]);
  });

  it('drops invalid optional fields but keeps the entry', () => {
    const raw = [{ book: { id: 'OL1W', title: 'Dune', authors: ['A', 3], year: '1965', coverId: 'x' }, status: 'reading' }];

    expect(parseReadingList(raw)).toEqual([{ book: { id: 'OL1W', title: 'Dune', authors: ['A'] }, status: 'reading' }]);
  });
});
