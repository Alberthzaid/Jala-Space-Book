import type { ReactNode } from 'react';

import type { Book } from '@/shared/types/book';
import BookCard from './BookCard';

interface BookGridProps {
  books: readonly Book[];
  renderAction?: (book: Book) => ReactNode;
  renderBadge?: (book: Book) => ReactNode;
}

export default function BookGrid({ books, renderAction, renderBadge }: BookGridProps) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
      {books.map((book) => (
        <li key={book.id} className="flex">
          <BookCard book={book} action={renderAction?.(book)} badge={renderBadge?.(book)} className="w-full" />
        </li>
      ))}
    </ul>
  );
}
