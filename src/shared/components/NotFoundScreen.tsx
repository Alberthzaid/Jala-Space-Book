import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

import { CATALOG_PATH, HOME_PATH } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';

interface NotFoundScreenProps {
  title?: string;
  description?: string;
}

export default function NotFoundScreen({
  title = 'Página no encontrada',
  description = 'La dirección que buscas no existe o fue movida. Vuelve al inicio o explora el catálogo.',
}: NotFoundScreenProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center gap-4 py-20">
      <div className="w-16 h-16 rounded-2xl bg-secondary-fixed text-primary flex items-center justify-center">
        <SearchX className="size-9" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p className="text-sm text-on-surface-variant max-w-md">{description}</p>
      <div className="flex items-center gap-3 mt-4">
        <Button
          asChild
          className="h-auto px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-none hover:bg-primary-container transition-colors"
        >
          <Link to={CATALOG_PATH}>Explorar catálogo</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-auto px-4 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <Link to={HOME_PATH}>Ir al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
