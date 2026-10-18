import type { Book } from '@/shared/types/book';

const collator = new Intl.Collator('es', { sensitivity: 'base' });

export function sortBooksByAuthor<T extends Pick<Book, 'title' | 'authors'>>(books: readonly T[]): T[] {
  return [...books].sort((a, b) => {
    const authorA = a.authors[0];
    const authorB = b.authors[0];
    if (!authorA || !authorB) {
      if (authorA !== authorB) return authorA ? -1 : 1;
    } else {
      const byAuthor = collator.compare(authorA, authorB);
      if (byAuthor !== 0) return byAuthor;
    }
    return collator.compare(a.title, b.title);
  });
}
