import { cn } from '@/shared/lib/utils';

interface LoadingGridProps {
  count?: number;
  label?: string;
  layout?: 'grid' | 'row';
}

export default function LoadingGrid({ count = 10, label = 'Cargando libros…', layout = 'grid' }: LoadingGridProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full'
            : 'flex gap-4 overflow-hidden'
        )}
      >
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className={cn(
              'p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 animate-pulse',
              layout === 'row' && 'min-w-[180px] max-w-[180px]'
            )}
          >
            <div className="w-full aspect-[2/3] rounded-xl bg-surface-container-high" />
            <div className="h-3 rounded bg-surface-container-high w-4/5" />
            <div className="h-3 rounded bg-surface-container w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
