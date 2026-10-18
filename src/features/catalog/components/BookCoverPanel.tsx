import { BookmarkCheck, BookmarkPlus, ExternalLink } from 'lucide-react';

import { ReadingStatusControl, useReadingList, type SavedBook } from '@/features/reading-list';
import BookCover from '@/shared/components/BookCover';
import { OPEN_LIBRARY_WORK_URL } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface BookCoverPanelProps {
  book: SavedBook;
}

export default function BookCoverPanel({ book }: BookCoverPanelProps) {
  const { getStatus, add, remove, setStatus } = useReadingList();
  const status = getStatus(book.id);
  const isSaved = status !== undefined;

  return (
    <Card className="bg-surface-container-lowest rounded-xl border-0 p-4 shadow-sm flex flex-col items-center">
      <div className="w-full max-w-[280px] aspect-[2/3] rounded-xl overflow-hidden shadow-xl">
        <BookCover title={book.title} coverId={book.coverId} size="L" />
      </div>

      <div className="mt-4 w-full flex flex-col gap-2.5">
        <Button
          onClick={() => (isSaved ? remove(book.id) : add(book))}
          aria-pressed={isSaved}
          className="w-full h-auto py-3 px-4 bg-primary-container text-on-primary hover:bg-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all [&_svg]:size-5"
          type="button"
        >
          {isSaved ? <BookmarkCheck aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
          <span>{isSaved ? 'Quitar de mi lista' : 'Guardar en mi lista'}</span>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="w-full h-auto py-2.5 px-4 bg-surface-container-low text-primary hover:text-primary hover:bg-surface-container rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors [&_svg]:size-5"
        >
          <a href={`${OPEN_LIBRARY_WORK_URL}/${book.id}`} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            <span>Ver en Open Library</span>
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </Button>
      </div>

      <div className="mt-4 w-full">
        <span id="reading-status-label" className="text-[11px] font-semibold text-outline uppercase tracking-wider block mb-1.5 px-1">
          Mi estado de lectura
        </span>
        <ReadingStatusControl
          status={status}
          onChange={(nextStatus) => setStatus(book, nextStatus)}
          label="Mi estado de lectura"
        />
        {!isSaved && (
          <p className="mt-1.5 px-1 text-[11px] text-on-surface-variant">Elegir un estado guarda el libro en tu lista.</p>
        )}
      </div>
    </Card>
  );
}
