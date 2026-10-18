import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { AvailabilityBadge, useAvailability } from '@/features/loans';
import { SaveToListButton } from '@/features/reading-list';
import { searchBooks } from '@/shared/api/openLibrary';
import BookGrid from '@/shared/components/BookGrid';
import ErrorState from '@/shared/components/ErrorState';
import LoadingGrid from '@/shared/components/LoadingGrid';
import { useAsync } from '@/shared/hooks/useAsync';
import { getCatalogSubjectPath } from '@/shared/lib/paths';

const RELATED_LIMIT = 5;

interface RelatedBooksSectionProps {
  subject: string;
  excludeId: string;
}

export default function RelatedBooksSection({ subject, excludeId }: RelatedBooksSectionProps) {
  const related = useAsync(
    (signal) => searchBooks({ subject, limit: RELATED_LIMIT + 1 }, signal),
    [subject]
  );
  const books = (related.data?.books ?? []).filter((book) => book.id !== excludeId).slice(0, RELATED_LIMIT);
  const { availability } = useAvailability(books.map((book) => book.id));

  if (related.status === 'success' && books.length === 0) return null;

  return (
    <section aria-labelledby="related-books-title" className="mt-4 mb-8 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 id="related-books-title" className="text-xl font-bold text-primary tracking-tight">Libros relacionados</h2>
          <span className="text-xs text-on-surface-variant">Otras obras de la materia «{subject}»</span>
        </div>
        <Link to={getCatalogSubjectPath(subject)} className="text-secondary text-sm font-semibold hover:underline flex items-center gap-1">
          <span>Ver todos</span>
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </Link>
      </div>

      {related.status === 'error' && (
        <ErrorState title="No pudimos cargar los libros relacionados" onRetry={related.retry} />
      )}
      {related.status === 'loading' && <LoadingGrid count={RELATED_LIMIT} label="Cargando libros relacionados…" />}
      {related.status === 'success' && (
        <BookGrid
          books={books}
          renderAction={(book) => <SaveToListButton book={book} />}
          renderBadge={(book) => <AvailabilityBadge availability={availability[book.id]} />}
        />
      )}
    </section>
  );
}
