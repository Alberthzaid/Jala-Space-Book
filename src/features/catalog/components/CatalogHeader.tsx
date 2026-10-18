import type { ReactNode } from 'react';

interface CatalogHeaderProps {
  children: ReactNode;
}

export default function CatalogHeader({ children }: CatalogHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 max-w-2xl">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Explorar catálogo</h1>
        <p className="text-base text-on-surface-variant">
          Busca entre millones de libros del catálogo abierto de Open Library por título, autor o materia.
        </p>
      </div>
      {children}
    </header>
  );
}
