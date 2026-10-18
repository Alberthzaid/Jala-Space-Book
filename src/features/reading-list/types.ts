import type { Book } from '@/shared/types/book';

export type ReadingStatus = 'want' | 'reading' | 'read';

export type SavedBook = Pick<Book, 'id' | 'title' | 'authors' | 'year' | 'coverId'>;

export interface ReadingListEntry {
  book: SavedBook;
  status: ReadingStatus;
}

export type ReadingListAction =
  | { type: 'add'; book: SavedBook }
  | { type: 'setStatus'; book: SavedBook; status: ReadingStatus }
  | { type: 'remove'; id: string };
