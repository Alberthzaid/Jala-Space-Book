import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/shared/ui/input';

interface AppHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: () => void;
  actions?: ReactNode;
}

const SEARCH_MAX_LENGTH = 200;

export default function AppHeader({ searchQuery, setSearchQuery, onSearchSubmit, actions }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 px-6 flex items-center gap-4">
      <span className="text-base text-on-surface font-semibold hidden md:inline">Área de lectores</span>

      <div className="flex-1 max-w-xl mx-auto">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit?.();
          }}
          className="relative flex items-center w-full"
        >
          <Search className="absolute left-3.5 text-outline size-5 pointer-events-none" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border-0 shadow-none bg-surface-container-low text-on-surface placeholder:text-outline text-sm md:text-sm focus-visible:outline-none focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-secondary transition-all"
            placeholder="Buscar libros, autores o palabras clave..."
            aria-label="Buscar en el catálogo"
            type="search"
            maxLength={SEARCH_MAX_LENGTH}
          />
        </form>
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
