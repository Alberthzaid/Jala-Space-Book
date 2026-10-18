import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Card } from '@/shared/ui/card';
import { getBookDetailPath } from '@/shared/lib/paths';
import { cn } from '@/shared/lib/utils';
import type { Book } from '@/shared/types/book';
import BookCover from './BookCover';

interface BookCardProps {
  book: Book;
  action?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

function formatMeta(book: Book): string {
  const parts: string[] = [];
  if (book.year) parts.push(String(book.year));
  if (book.editionCount) parts.push(`${book.editionCount} ${book.editionCount === 1 ? 'edición' : 'ediciones'}`);
  return parts.join(' • ');
}

export default function BookCard({ book, action, badge, className }: BookCardProps) {
  const detailPath = getBookDetailPath(book.id);
  const meta = formatMeta(book);

  return (
    <Card
      role="article"
      className={cn(
        'flex flex-col p-3 rounded-2xl border-0 bg-surface-container-lowest shadow-sm hover:shadow-md transition-all group',
        className
      )}
    >
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-inner">
        <Link to={detailPath} tabIndex={-1} aria-hidden="true" className="block w-full h-full">
          <BookCover
            title={book.title}
            coverId={book.coverId}
            imageClassName="group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {action && <div className="absolute top-2 right-2">{action}</div>}
      </div>
      <div className="flex flex-col gap-0.5 mt-3 min-w-0">
        <h3 className="text-sm text-primary font-semibold leading-snug line-clamp-2 group-hover:text-secondary transition-colors" title={book.title}>
          <Link to={detailPath} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
            {book.title}
          </Link>
        </h3>
        <p className="text-xs text-on-surface-variant truncate">
          {book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido'}
        </p>
        {meta && <p className="text-[11px] text-outline">{meta}</p>}
        {badge && <div className="mt-1.5">{badge}</div>}
      </div>
    </Card>
  );
}
