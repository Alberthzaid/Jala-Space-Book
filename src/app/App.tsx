import { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { UserMenu } from '@/features/auth';
import { useLoans } from '@/features/loans';
import { AvailabilityNotices, NotificationsBell } from '@/features/notifications';
import { useReadingList } from '@/features/reading-list';
import RouteSkeleton from '@/shared/components/RouteSkeleton';
import { LOANS_PATH, READING_LIST_PATH, getCatalogSearchPath } from '@/shared/lib/paths';
import { AppLayout } from '@/shared/layout';
import { APP_ROUTES } from './routes';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { count } = useReadingList();
  const { activeLoans, configured } = useLoans();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleSearchSubmit = () => {
    navigate(getCatalogSearchPath(searchQuery));
  };

  return (
    <AppLayout
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSearchSubmit={handleSearchSubmit}
      navBadges={{ [READING_LIST_PATH]: count, [LOANS_PATH]: activeLoans.length }}
      headerActions={
        <>
          {configured && <NotificationsBell />}
          <UserMenu />
        </>
      }
    >
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          {APP_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </Suspense>
      <AvailabilityNotices />
    </AppLayout>
  );
}
