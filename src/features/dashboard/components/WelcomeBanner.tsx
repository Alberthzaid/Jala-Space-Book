import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { getCatalogSubjectPath } from '@/shared/lib/paths';
import { getSubjectLabel } from '@/shared/lib/subjects';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { QUICK_SEARCH_SUBJECTS } from '../data/home';

interface WelcomeBannerProps {
  onSearch: (term: string) => void;
}

export default function WelcomeBanner({ onSearch }: WelcomeBannerProps) {
  const [term, setTerm] = useState('');

  return (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-container via-primary to-primary-container p-6 lg:p-10 text-on-primary shadow-sm">
      <div className="absolute -right-16 -top-24 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" aria-hidden="true"></div>
      <div className="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-surface-tint/15 blur-2xl pointer-events-none" aria-hidden="true"></div>
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-on-primary">Descubre tu próxima lectura</h1>
          <p className="text-base text-primary-fixed-dim/90">
            Explora millones de libros del catálogo abierto de Open Library y guarda los que te interesen en tu lista.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 w-full lg:w-96 bg-surface-container-lowest/10 backdrop-blur-md p-4 rounded-xl">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(term);
            }}
            className="relative flex items-center"
          >
            <Input
              className="w-full h-auto border-0 bg-surface-container-lowest text-on-surface text-sm md:text-sm rounded-lg pl-3 pr-9 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary shadow-sm placeholder:text-outline"
              placeholder="Título, autor o palabra clave..."
              aria-label="Buscar libros"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 h-auto w-auto p-0 text-secondary hover:text-primary hover:bg-transparent transition-colors [&_svg]:size-5"
              aria-label="Buscar en el catálogo"
              type="submit"
            >
              <ArrowRight />
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-primary-fixed-dim">
            <span>Materias:</span>
            {QUICK_SEARCH_SUBJECTS.map((slug) => (
              <Link
                key={slug}
                to={getCatalogSubjectPath(slug)}
                className="px-2 py-0.5 rounded bg-on-primary/10 hover:bg-on-primary/20 text-[11px] text-primary-fixed-dim transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed"
              >
                {getSubjectLabel(slug)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
