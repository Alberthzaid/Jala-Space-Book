export default function RouteSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <span className="sr-only">Cargando la página…</span>
      <div aria-hidden="true" className="flex flex-col gap-6 animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 rounded bg-surface-container-high" />
          <div className="h-4 w-96 max-w-full rounded bg-surface-container" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3">
              <div className="w-full aspect-[2/3] rounded-xl bg-surface-container-high" />
              <div className="h-3 rounded bg-surface-container-high w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
