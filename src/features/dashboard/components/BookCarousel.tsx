import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import { SaveToListButton } from '@/features/reading-list';
import type { AsyncResult } from '@/shared/hooks/useAsync';
import BookCard from '@/shared/components/BookCard';
import ErrorState from '@/shared/components/ErrorState';
import LoadingGrid from '@/shared/components/LoadingGrid';
import { Button } from '@/shared/ui/button';
import type { Book } from '@/shared/types/book';

const SCROLL_STEP = 400;

interface BookCarouselProps {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  seeAllHref?: string;
  result: AsyncResult<Book[]>;
}

export default function BookCarousel({ id, title, description, icon, seeAllHref, result }: BookCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const titleId = `${id}-title`;
  const books = result.data ?? [];

  const scrollBy = (distance: number) => scrollerRef.current?.scrollBy({ left: distance, behavior: 'smooth' });

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="flex flex-col min-w-0">
            <h2 id={titleId} className="text-xl font-bold text-on-surface">{title}</h2>
            {description && <span className="text-xs text-on-surface-variant">{description}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {seeAllHref && (
            <Link to={seeAllHref} className="mr-2 text-secondary text-sm font-semibold hover:underline flex items-center gap-1">
              <span>Ver más</span>
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </Link>
          )}
          {result.status === 'success' && books.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors [&_svg]:size-5"
                onClick={() => scrollBy(-SCROLL_STEP)}
                aria-label={`Desplazar ${title} hacia atrás`}
                type="button"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors [&_svg]:size-5"
                onClick={() => scrollBy(SCROLL_STEP)}
                aria-label={`Desplazar ${title} hacia adelante`}
                type="button"
              >
                <ChevronRight />
              </Button>
            </>
          )}
        </div>
      </div>

      {result.status === 'error' && <ErrorState onRetry={result.retry} />}
      {(result.status === 'loading' || result.status === 'idle') && (
        <LoadingGrid layout="row" count={6} label={`Cargando ${title}…`} />
      )}
      {result.status === 'success' && books.length === 0 && (
        <p className="text-sm text-on-surface-variant">No hay libros para mostrar en esta sección por ahora.</p>
      )}
      {result.status === 'success' && books.length > 0 && (
        <ul ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {books.map((book) => (
            <li key={book.id} className="min-w-[180px] max-w-[180px] snap-start flex">
              <BookCard book={book} action={<SaveToListButton book={book} />} className="w-full" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
