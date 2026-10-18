import { Grid3x3, Search, X } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { SUBJECTS } from '@/shared/lib/subjects';
import { cn } from '@/shared/lib/utils';
import { MAX_QUERY_LENGTH } from '../lib/catalogQuery';

interface CatalogSearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
}

const CHIP_CLASS =
  'shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary';
const CHIP_IDLE_CLASS = 'bg-surface-container-low hover:bg-surface-container-high text-on-surface';
const CHIP_ACTIVE_CLASS = 'bg-primary-container text-on-primary shadow-sm';

export default function CatalogSearchPanel({ searchTerm, onSearchTermChange, subject, onSubjectChange }: CatalogSearchPanelProps) {
  return (
    <div className="p-2.5 rounded-2xl bg-surface-container-lowest shadow-md flex flex-col gap-3">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative flex items-center w-full">
        <Search className="absolute left-4 text-outline size-[22px] pointer-events-none" aria-hidden="true" />
        <Input
          value={searchTerm}
          maxLength={MAX_QUERY_LENGTH}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="w-full h-12 pl-12 pr-12 rounded-xl border-0 shadow-none bg-surface-container-low text-on-surface placeholder:text-outline text-sm md:text-sm focus-visible:outline-none focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-secondary transition-all"
          placeholder="Buscar por título, autor o palabra clave..."
          aria-label="Buscar libros por título, autor o palabra clave"
          type="search"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchTermChange('')}
            className="absolute right-3 h-auto w-auto p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-highest transition-colors [&_svg]:size-[18px]"
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
            type="button"
          >
            <X />
          </Button>
        )}
      </form>

      <div role="group" aria-label="Filtrar por materia" className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          aria-pressed={!subject}
          onClick={() => onSubjectChange('')}
          className={cn(CHIP_CLASS, !subject ? CHIP_ACTIVE_CLASS : CHIP_IDLE_CLASS)}
        >
          <Grid3x3 className="size-4" aria-hidden="true" />
          <span>Todas las materias</span>
        </button>
        {SUBJECTS.map(({ label, slug }) => {
          const isSelected = subject === slug;
          return (
            <button
              key={slug}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSubjectChange(isSelected ? '' : slug)}
              className={cn(CHIP_CLASS, isSelected ? CHIP_ACTIVE_CLASS : CHIP_IDLE_CLASS)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
