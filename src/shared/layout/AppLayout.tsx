import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';

interface AppLayoutProps {
  children: ReactNode;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: () => void;
  navBadges?: Readonly<Record<string, number>>;
  headerActions?: ReactNode;
}

export default function AppLayout({
  children,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  navBadges,
  headerActions,
}: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface">
      <AppSidebar currentPath={location.pathname} navBadges={navBadges} />

      <div className="pl-64">
        <AppHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={onSearchSubmit}
          actions={headerActions}
        />

        <main className="relative pt-16 bg-surface min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
