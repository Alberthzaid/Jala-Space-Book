import { BookOpen, BookUp, Bookmark, LayoutGrid, type LucideIcon } from 'lucide-react';

import { CATALOG_PATH, HOME_PATH, LOANS_PATH, READING_LIST_PATH } from '@/shared/lib/paths';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badgeLabel?: { one: string; other: string };
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: HOME_PATH, label: 'Inicio', icon: LayoutGrid },
  { path: CATALOG_PATH, label: 'Explorar catálogo', icon: BookOpen },
  {
    path: READING_LIST_PATH,
    label: 'Mi lista',
    icon: Bookmark,
    badgeLabel: { one: 'libro guardado', other: 'libros guardados' },
  },
  {
    path: LOANS_PATH,
    label: 'Mis préstamos',
    icon: BookUp,
    badgeLabel: { one: 'préstamo activo', other: 'préstamos activos' },
  },
];

export function isNavItemActive(itemPath: string, currentPath: string): boolean {
  return currentPath === itemPath || (itemPath === CATALOG_PATH && currentPath.startsWith('/libro/'));
}
