import { Link } from 'react-router-dom';
import { ExternalLink, Library } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS, isNavItemActive } from './navigation';

interface AppSidebarProps {
  currentPath: string;
  navBadges?: Readonly<Record<string, number>>;
}

export default function AppSidebar({ currentPath, navBadges = {} }: AppSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
      <div className="flex flex-col">
        <Link to="/" className="h-16 px-4 flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
            <Library className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base text-primary tracking-tight font-bold leading-none">BookSpace</span>
            <span className="text-[11px] text-on-surface-variant leading-tight">Explorador de libros</span>
          </div>
        </Link>
        <div className="px-4 pt-1">
          <span className="text-[11px] text-outline uppercase tracking-wider px-2 font-semibold">Menú principal</span>
        </div>
        <nav aria-label="Navegación principal" className="flex flex-col gap-1 px-2 mt-1">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item.path, currentPath);
            const Icon = item.icon;
            const badge = navBadges[item.path] ?? 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between px-4 py-2.5 rounded-xl transition-all',
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant text-sm font-medium hover:bg-surface-container-high hover:text-on-surface'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
                {badge > 0 && (
                  <Badge
                    variant="outline"
                    className="border-0 text-[11px] px-2 py-0.5 rounded-full font-bold bg-secondary text-on-secondary"
                  >
                    {badge}
                    {item.badgeLabel && (
                      <span className="sr-only"> {badge === 1 ? item.badgeLabel.one : item.badgeLabel.other}</span>
                    )}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <a
        href="https://openlibrary.org"
        target="_blank"
        rel="noreferrer"
        className="m-2 p-3 rounded-xl bg-surface-container text-[11px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-between gap-2"
      >
        <span>Datos de <strong className="font-semibold">Open Library</strong></span>
        <ExternalLink className="size-3.5" aria-hidden="true" />
        <span className="sr-only">(se abre en una pestaña nueva)</span>
      </a>
    </aside>
  );
}
