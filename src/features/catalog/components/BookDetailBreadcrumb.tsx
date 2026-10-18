import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { CATALOG_PATH } from '@/shared/lib/paths';

interface BookDetailBreadcrumbProps {
  bookTitle?: string;
}

export default function BookDetailBreadcrumb({ bookTitle }: BookDetailBreadcrumbProps) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex items-center gap-2 text-xs text-on-surface-variant">
        <li>
          <Link to={CATALOG_PATH} className="hover:text-secondary transition-colors font-medium">Explorar catálogo</Link>
        </li>
        <li aria-hidden="true"><ChevronRight className="size-4 text-outline" /></li>
        <li aria-current="page" className="text-sm text-on-surface font-semibold truncate max-w-xs md:max-w-md">
          {bookTitle ?? 'Ficha del libro'}
        </li>
      </ol>
    </nav>
  );
}
