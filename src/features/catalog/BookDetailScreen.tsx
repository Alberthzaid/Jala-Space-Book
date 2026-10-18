import { useParams } from 'react-router-dom';

import { LoanActions } from '@/features/loans';
import { OpenLibraryError, getWork, isValidWorkId } from '@/shared/api/openLibrary';
import ErrorState from '@/shared/components/ErrorState';
import NotFoundScreen from '@/shared/components/NotFoundScreen';
import { useAsync } from '@/shared/hooks/useAsync';
import BookCoverPanel from './components/BookCoverPanel';
import BookDetailBreadcrumb from './components/BookDetailBreadcrumb';
import BookOverviewCard from './components/BookOverviewCard';
import RelatedBooksSection from './components/RelatedBooksSection';

const NOT_FOUND_TITLE = 'Libro no encontrado';
const NOT_FOUND_DESCRIPTION =
  'No existe ninguna obra con este identificador en Open Library. Puede que el enlace sea incorrecto.';

function DetailSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <span className="sr-only">Cargando la ficha del libro…</span>
      <div aria-hidden="true" className="lg:col-span-4 p-4 rounded-xl bg-surface-container-lowest shadow-sm animate-pulse flex flex-col items-center gap-4">
        <div className="w-full max-w-[280px] aspect-[2/3] rounded-xl bg-surface-container-high" />
        <div className="w-full h-11 rounded-xl bg-surface-container-high" />
      </div>
      <div aria-hidden="true" className="lg:col-span-8 p-6 rounded-xl bg-surface-container-lowest shadow-sm animate-pulse flex flex-col gap-3">
        <div className="h-8 w-3/4 rounded bg-surface-container-high" />
        <div className="h-4 w-1/3 rounded bg-surface-container" />
        <div className="h-4 w-full rounded bg-surface-container mt-4" />
        <div className="h-4 w-full rounded bg-surface-container" />
        <div className="h-4 w-2/3 rounded bg-surface-container" />
      </div>
    </div>
  );
}

export default function BookDetailScreen() {
  const { id } = useParams();
  const workId = isValidWorkId(id) ? id : null;
  const work = useAsync(workId ? (signal) => getWork(workId, signal) : null, [workId]);

  const isNotFound = !workId || (work.error instanceof OpenLibraryError && work.error.isNotFound);
  if (isNotFound) {
    return <NotFoundScreen title={NOT_FOUND_TITLE} description={NOT_FOUND_DESCRIPTION} />;
  }

  const book = work.status === 'success' ? work.data : undefined;
  const firstSubject = book?.subjects[0];

  return (
    <div className="flex flex-col w-full">
      <div className="px-4 lg:px-8 py-6 flex flex-col gap-6 max-w-[1440px] mx-auto w-full">
        <BookDetailBreadcrumb bookTitle={book?.title} />

        {work.status === 'error' && (
          <ErrorState title="No pudimos cargar este libro" onRetry={work.retry} />
        )}
        {(work.status === 'loading' || work.status === 'idle') && <DetailSkeleton />}
        {book && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <aside className="lg:col-span-4 flex flex-col gap-4">
                <BookCoverPanel
                  book={{
                    id: book.id,
                    title: book.title,
                    authors: book.authors.map((author) => author.name),
                    year: book.year,
                    coverId: book.coverId,
                  }}
                />
                <LoanActions
                  book={{
                    id: book.id,
                    title: book.title,
                    authors: book.authors.map((author) => author.name),
                    coverId: book.coverId,
                  }}
                />
              </aside>
              <section className="lg:col-span-8 flex flex-col gap-6">
                <BookOverviewCard book={book} />
              </section>
            </div>

            {firstSubject && <RelatedBooksSection subject={firstSubject} excludeId={book.id} />}
          </>
        )}
      </div>
    </div>
  );
}
