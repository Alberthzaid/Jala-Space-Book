import { SearchX } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface CatalogEmptyStateProps {
  searchTerm: string;
  onReset: () => void;
}

export default function CatalogEmptyState({ searchTerm, onReset }: CatalogEmptyStateProps) {
  return (
    <Card className="p-10 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-primary flex items-center justify-center">
        <SearchX className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-primary">No encontramos libros</h2>
      <p className="text-sm text-on-surface-variant max-w-md">
        {searchTerm
          ? <>Ningún título o autor coincide con <strong className="text-on-surface">"{searchTerm}"</strong> con los filtros actuales.</>
          : 'Ningún libro coincide con la materia seleccionada.'}
      </p>
      <Button
        onClick={onReset}
        className="mt-2 h-auto px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-none hover:bg-primary-container transition-colors"
        type="button"
      >
        Limpiar búsqueda y filtros
      </Button>
    </Card>
  );
}
