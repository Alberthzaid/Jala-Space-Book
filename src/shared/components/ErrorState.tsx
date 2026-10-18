import { CloudOff, RotateCw } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
}

export default function ErrorState({
  title = 'No pudimos cargar los libros',
  description = 'Open Library no respondió. Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card role="alert" className="p-8 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center">
        <CloudOff className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-bold text-on-surface">{title}</h2>
      <p className="text-sm text-on-surface-variant max-w-md">{description}</p>
      <Button
        onClick={onRetry}
        className="mt-1 h-auto px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-none hover:bg-primary-container transition-colors flex items-center gap-2 [&_svg]:size-4"
        type="button"
      >
        <RotateCw aria-hidden="true" />
        Reintentar
      </Button>
    </Card>
  );
}
