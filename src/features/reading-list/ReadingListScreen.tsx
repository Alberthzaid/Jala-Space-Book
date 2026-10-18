import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkX, Library, Trash2 } from 'lucide-react';

import BookCover from '@/shared/components/BookCover';
import { CATALOG_PATH, getBookDetailPath } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import ReadingStatusControl from './components/ReadingStatusControl';
import { READING_STATUSES, READING_STATUS_LABELS, countByStatus, isReadingStatus } from './lib/readingList';
import type { ReadingListEntry, ReadingStatus } from './types';
import { useReadingList } from './useReadingList';

const EMPTY_TAB_MESSAGES: Record<ReadingStatus, string> = {
  want: 'Aún no tienes libros pendientes. Guarda los que te interesen desde el catálogo.',
  reading: 'No estás leyendo ningún libro. Cambia el estado de un libro guardado a "Leyendo".',
  read: 'Todavía no marcaste libros como leídos.',
};

function ReadingListItem({ entry }: { entry: ReadingListEntry }) {
  const { setStatus, remove } = useReadingList();
  const { book } = entry;
  const detailPath = getBookDetailPath(book.id);

  return (
    <li>
      <Card className="p-3 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex gap-4 items-start">
        <Link to={detailPath} tabIndex={-1} aria-hidden="true" className="w-16 shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
          <BookCover title={book.title} coverId={book.coverId} size="S" />
        </Link>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2">
                <Link to={detailPath} className="rounded hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  {book.title}
                </Link>
              </h3>
              <p className="text-xs text-on-surface-variant truncate">
                {book.authors.length > 0 ? book.authors.join(', ') : 'Autor desconocido'}
                {book.year ? ` • ${book.year}` : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove(book.id)}
              aria-label={`Quitar ${book.title} de mi lista`}
              title="Quitar de mi lista"
              className="h-auto w-auto p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high [&_svg]:size-[18px]"
              type="button"
            >
              <Trash2 />
            </Button>
          </div>
          <div className="max-w-sm">
            <ReadingStatusControl
              status={entry.status}
              onChange={(status) => setStatus(book, status)}
              label={`Estado de lectura de ${book.title}`}
            />
          </div>
        </div>
      </Card>
    </li>
  );
}

function EmptyList() {
  return (
    <Card className="p-10 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-primary flex items-center justify-center">
        <Library className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-primary">Tu lista está vacía</h2>
      <p className="text-sm text-on-surface-variant max-w-md">
        Busca libros en el catálogo y usa el marcador para guardarlos. Tu lista se guarda en este navegador.
      </p>
      <Button asChild className="mt-2 h-auto px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-none hover:bg-primary-container transition-colors">
        <Link to={CATALOG_PATH}>Explorar catálogo</Link>
      </Button>
    </Card>
  );
}

export default function ReadingListScreen() {
  const { entries } = useReadingList();
  const [activeStatus, setActiveStatus] = useState<ReadingStatus>('want');
  const counts = countByStatus(entries);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Mi lista</h1>
          <p className="text-base text-on-surface-variant">
            Organiza lo que quieres leer, lo que estás leyendo y lo que ya terminaste. Se guarda solo en este navegador.
          </p>
        </header>

        {entries.length === 0 ? (
          <EmptyList />
        ) : (
          <Tabs value={activeStatus} onValueChange={(value) => isReadingStatus(value) && setActiveStatus(value)}>
            <TabsList className="h-auto w-full sm:w-auto grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl text-on-surface-variant">
              {READING_STATUSES.map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="py-2 px-3 rounded-lg text-sm font-semibold gap-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  <span>{READING_STATUS_LABELS[status]}</span>
                  <span className="text-xs font-bold px-1.5 rounded-full bg-surface-container text-on-surface-variant">
                    {counts[status]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {READING_STATUSES.map((status) => {
              const items = entries.filter((entry) => entry.status === status);
              return (
                <TabsContent key={status} value={status} className="mt-4">
                  {items.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((entry) => (
                        <ReadingListItem key={entry.book.id} entry={entry} />
                      ))}
                    </ul>
                  ) : (
                    <Card className="p-8 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-2">
                      <BookmarkX className="size-6 text-outline" aria-hidden="true" />
                      <p className="text-sm text-on-surface-variant max-w-md">{EMPTY_TAB_MESSAGES[status]}</p>
                    </Card>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
