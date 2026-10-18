import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { getCatalogSearchPath, getCatalogSubjectPath } from '@/shared/lib/paths';
import { cn } from '@/shared/lib/utils';
import { badgeVariants } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import type { BookDetail } from '@/shared/types/book';

const MAX_SUBJECTS = 8;
const COLLAPSED_DESCRIPTION_LENGTH = 600;

interface BookOverviewCardProps {
  book: BookDetail;
}

export default function BookOverviewCard({ book }: BookOverviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const description = book.description;
  const isLong = (description?.length ?? 0) > COLLAPSED_DESCRIPTION_LENGTH;
  const visibleDescription =
    description && isLong && !expanded ? `${description.slice(0, COLLAPSED_DESCRIPTION_LENGTH).trimEnd()}…` : description;
  const subjects = book.subjects.slice(0, MAX_SUBJECTS);

  return (
    <Card className="bg-surface-container-lowest rounded-xl border-0 p-6 shadow-sm flex flex-col gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-primary tracking-tight leading-tight">{book.title}</h1>
        <p className="text-base text-on-surface-variant mt-2 leading-snug">
          {book.authors.length > 0 ? (
            <>
              Por{' '}
              {book.authors.map((author, index) => (
                <span key={author.id}>
                  {index > 0 && ', '}
                  <Link
                    to={getCatalogSearchPath(author.name)}
                    className="font-semibold text-on-surface hover:text-secondary underline-offset-2 hover:underline"
                  >
                    {author.name}
                  </Link>
                </span>
              ))}
            </>
          ) : (
            'Autor desconocido'
          )}
          {book.year ? <span className="text-outline"> • Publicado por primera vez en {book.year}</span> : null}
        </p>
      </div>

      {subjects.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-outline uppercase tracking-wider">Materias</h2>
          <ul className="flex flex-wrap items-center gap-2">
            {subjects.map((subject) => (
              <li key={subject}>
                <Link
                  to={getCatalogSubjectPath(subject)}
                  className={cn(
                    badgeVariants({ variant: 'outline' }),
                    'bg-surface-container px-3 py-1 rounded-full text-xs text-primary font-semibold border-0 hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-secondary'
                  )}
                >
                  {subject}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold text-on-surface">Descripción</h2>
        {visibleDescription ? (
          <>
            <p id="book-description" className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
              {visibleDescription}
            </p>
            {isLong && (
              <Button
                variant="link"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                aria-controls="book-description"
                className="self-start h-auto p-0 text-secondary text-xs font-semibold flex items-center gap-1 [&_svg]:size-[18px]"
                type="button"
              >
                <span>{expanded ? 'Mostrar menos' : 'Leer descripción completa'}</span>
                {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">Open Library no tiene una descripción para esta obra.</p>
        )}
      </div>
    </Card>
  );
}
