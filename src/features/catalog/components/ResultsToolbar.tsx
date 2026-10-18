import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { CatalogSort } from '../lib/catalogQuery';

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

const SORT_OPTIONS: readonly { value: CatalogSort; label: string }[] = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'new', label: 'Más recientes' },
  { value: 'old', label: 'Más antiguos' },
  { value: 'title', label: 'Título (A-Z)' },
  { value: 'author', label: 'Autor (A-Z)' },
  { value: 'rating', label: 'Mejor valorados' },
];

interface ResultsToolbarProps {
  numFound?: number;
  activeFilters: readonly ActiveFilterChip[];
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
}

export default function ResultsToolbar({ numFound, activeFilters, sort, onSortChange }: ResultsToolbarProps) {
  const resultLabel =
    numFound === undefined
      ? 'Buscando…'
      : `${numFound.toLocaleString('es')} ${numFound === 1 ? 'resultado' : 'resultados'}`;

  return (
    <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-on-surface font-semibold" aria-live="polite">
          <span className="text-primary font-bold">{resultLabel}</span>
        </span>
        {activeFilters.map((chip) => (
          <Badge
            key={chip.key}
            variant="outline"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-medium border-0"
          >
            {chip.label}
            <Button
              variant="ghost"
              onClick={chip.onRemove}
              className="h-auto p-0 text-xs font-medium text-outline hover:text-error hover:bg-transparent transition-colors"
              aria-label={`Quitar filtro ${chip.label}`}
              type="button"
            >
              ✕
            </Button>
          </Badge>
        ))}
      </div>

      <div className="flex flex-col items-start md:items-end gap-1">
      <div className="flex items-center gap-2">
        <span id="catalog-sort-label" className="text-xs text-outline">Ordenar:</span>
        <Select value={sort} onValueChange={(value) => {
          const option = SORT_OPTIONS.find((candidate) => candidate.value === value);
          if (option) onSortChange(option.value);
        }}>
          <SelectTrigger
            aria-labelledby="catalog-sort-label"
            className="w-auto h-auto gap-1.5 border-0 shadow-none bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold py-2 pl-3 pr-2.5 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary"
            iconClassName="size-4 opacity-100 text-outline"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-0 bg-surface-container-lowest shadow-md">
            {SORT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-xs text-on-surface rounded-lg focus:bg-surface-container focus:text-on-surface"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {sort === 'author' && (
        <p className="text-[11px] text-on-surface-variant">Ordenado por autor dentro de esta página.</p>
      )}
      </div>
    </div>
  );
}
