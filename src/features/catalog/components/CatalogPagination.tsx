import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

const NAV_CLASS =
  'h-auto px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium flex items-center gap-1 disabled:opacity-50 [&_svg]:size-4';

interface CatalogPaginationProps {
  page: number;
  totalPages: number;
  numFound: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function CatalogPagination({ page, totalPages, numFound, pageSize, onPageChange }: CatalogPaginationProps) {
  const firstShown = (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, numFound);

  return (
    <Card className="mt-2 p-4 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <span>
          Página <strong className="text-primary font-semibold">{page.toLocaleString('es')}</strong> de {totalPages.toLocaleString('es')}
        </span>
        <span className="text-outline" aria-hidden="true">•</span>
        <span>
          {firstShown.toLocaleString('es')}–{lastShown.toLocaleString('es')} de {numFound.toLocaleString('es')} títulos
        </span>
      </div>
      <nav aria-label="Paginación del catálogo" className="flex items-center gap-1.5">
        <Button variant="ghost" className={NAV_CLASS} disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
          <ChevronLeft aria-hidden="true" />
          <span>Anterior</span>
        </Button>
        <span
          aria-current="page"
          className="min-w-8 h-8 px-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold shadow-sm flex items-center justify-center"
        >
          {page.toLocaleString('es')}
        </span>
        <Button variant="ghost" className={NAV_CLASS} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button">
          <span>Siguiente</span>
          <ChevronRight aria-hidden="true" />
        </Button>
      </nav>
    </Card>
  );
}
