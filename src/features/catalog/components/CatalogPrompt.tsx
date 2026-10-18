import { BookSearch } from 'lucide-react';

import { Card } from '@/shared/ui/card';

export default function CatalogPrompt() {
  return (
    <Card className="p-10 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-primary flex items-center justify-center">
        <BookSearch className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-primary">¿Qué quieres leer?</h2>
      <p className="text-sm text-on-surface-variant max-w-md">
        Escribe un título, un autor o una palabra clave, o elige una materia para empezar a explorar.
      </p>
    </Card>
  );
}
