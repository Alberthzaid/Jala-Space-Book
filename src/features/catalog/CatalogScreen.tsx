import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AvailabilityBadge, useAvailability } from '@/features/loans';
import { SaveToListButton } from '@/features/reading-list';
import { SEARCH_PAGE_SIZE, searchBooks } from '@/shared/api/openLibrary';
import BookGrid from '@/shared/components/BookGrid';
import ErrorState from '@/shared/components/ErrorState';
import LoadingGrid from '@/shared/components/LoadingGrid';
import { useAsync } from '@/shared/hooks/useAsync';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { getSubjectLabel } from '@/shared/lib/subjects';
import CatalogEmptyState from './components/CatalogEmptyState';
import CatalogHeader from './components/CatalogHeader';
import CatalogPagination from './components/CatalogPagination';
import CatalogPrompt from './components/CatalogPrompt';
import CatalogSearchPanel from './components/CatalogSearchPanel';
import ResultsToolbar, { type ActiveFilterChip } from './components/ResultsToolbar';
import {
  getTotalPages,
  hasSearchCriteria,
  isClientSideSort,
  parseCatalogQuery,
  toApiSort,
  withCatalogQuery,
  type CatalogQuery,
} from './lib/catalogQuery';
import { sortBooksByAuthor } from './lib/sortBooks';

const SEARCH_DEBOUNCE_MS = 400;

export default function CatalogScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseCatalogQuery(searchParams);
  const { q, subject, sort, page } = query;

  const [inputValue, setInputValue] = useState(q);
  const debouncedInput = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);

  const updateQuery = (patch: Partial<CatalogQuery>) => {
    setSearchParams((prev) => withCatalogQuery(prev, patch), { replace: patch.page === undefined });
  };

  useEffect(() => {
    if (debouncedInput.trim() !== q) updateQuery({ q: debouncedInput });
  }, [debouncedInput]);

  useEffect(() => {
    setInputValue((current) => (current.trim() === q ? current : q));
  }, [q]);

  const canSearch = hasSearchCriteria(query);
  const apiSort = toApiSort(sort);
  const results = useAsync(
    canSearch ? (signal) => searchBooks({ q, subject, sort: apiSort, page }, signal) : null,
    [q, subject, apiSort, page]
  );
  const pageBooks = results.status === 'success' ? (results.data?.books ?? []) : [];
  const books = isClientSideSort(sort) ? sortBooksByAuthor(pageBooks) : pageBooks;
  const { availability } = useAvailability(pageBooks.map((book) => book.id));

  const resetSearch = () => {
    setInputValue('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const changePage = (nextPage: number) => {
    updateQuery({ page: nextPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilters: ActiveFilterChip[] = [
    ...(q ? [{ key: 'q', label: `"${q}"`, onRemove: () => { setInputValue(''); updateQuery({ q: '' }); } }] : []),
    ...(subject ? [{ key: 'subject', label: getSubjectLabel(subject), onRemove: () => updateQuery({ subject: '' }) }] : []),
  ];

  const numFound = results.status === 'success' ? results.data?.numFound : undefined;
  const totalPages = numFound === undefined ? 0 : getTotalPages(numFound, SEARCH_PAGE_SIZE);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <CatalogHeader>
          <CatalogSearchPanel
            searchTerm={inputValue}
            onSearchTermChange={setInputValue}
            subject={subject}
            onSubjectChange={(nextSubject) => updateQuery({ subject: nextSubject })}
          />
        </CatalogHeader>

        <section aria-label="Resultados de búsqueda" className="w-full flex flex-col gap-4">
          {!canSearch ? (
            <CatalogPrompt />
          ) : (
            <>
              <ResultsToolbar
                numFound={numFound}
                activeFilters={activeFilters}
                sort={sort}
                onSortChange={(nextSort) => updateQuery({ sort: nextSort })}
              />
              {results.status === 'error' && <ErrorState onRetry={results.retry} />}
              {(results.status === 'loading' || results.status === 'idle') && <LoadingGrid />}
              {results.status === 'success' && results.data && (
                books.length > 0 ? (
                  <>
                    <BookGrid
                      books={books}
                      renderAction={(book) => <SaveToListButton book={book} />}
                      renderBadge={(book) => <AvailabilityBadge availability={availability[book.id]} />}
                    />
                    {totalPages > 1 && (
                      <CatalogPagination
                        page={page}
                        totalPages={totalPages}
                        numFound={results.data.numFound}
                        pageSize={SEARCH_PAGE_SIZE}
                        onPageChange={changePage}
                      />
                    )}
                  </>
                ) : (
                  <CatalogEmptyState searchTerm={q} onReset={resetSearch} />
                )
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
