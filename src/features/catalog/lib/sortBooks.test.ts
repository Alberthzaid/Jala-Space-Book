import { describe, expect, it } from 'vitest';

import type { Book } from '@/shared/types/book';
import { sortBooksByAuthor } from './sortBooks';

const book = (title: string, authors: string[]): Book => ({ id: `OL${title.length}W`, title, authors });

describe('sortBooksByAuthor', () => {
  it('sorts by first author, ignoring case and accents, with unknown authors last', () => {
    const sorted = sortBooksByAuthor([
      book('B', ['Zafón']),
      book('C', []),
      book('A', ['Austen']),
      book('D', ['álvarez']),
    ]);
    expect(sorted.map((item) => item.title)).toEqual(['D', 'A', 'B', 'C']);
  });

  it('breaks ties by title', () => {
    const sorted = sortBooksByAuthor([book('Persuasión', ['Austen']), book('Emma', ['Austen'])]);
    expect(sorted.map((item) => item.title)).toEqual(['Emma', 'Persuasión']);
  });

  it('does not mutate the input', () => {
    const input = [book('B', ['Zafón']), book('A', ['Austen'])];
    sortBooksByAuthor(input);
    expect(input.map((item) => item.title)).toEqual(['B', 'A']);
  });
});
