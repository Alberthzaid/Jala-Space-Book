import { lazy, type ReactElement } from 'react';

import { ProtectedRoute } from '@/features/auth';
import {
  BOOK_DETAIL_ROUTE,
  CATALOG_PATH,
  HOME_PATH,
  LOANS_PATH,
  LOGIN_PATH,
  READING_LIST_PATH,
  REGISTER_PATH,
} from '@/shared/lib/paths';

const DashboardScreen = lazy(() => import('@/features/dashboard/DashboardScreen'));
const CatalogScreen = lazy(() => import('@/features/catalog/CatalogScreen'));
const BookDetailScreen = lazy(() => import('@/features/catalog/BookDetailScreen'));
const ReadingListScreen = lazy(() => import('@/features/reading-list/ReadingListScreen'));
const LoginScreen = lazy(() => import('@/features/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('@/features/auth/RegisterScreen'));
const LoansScreen = lazy(() => import('@/features/loans/LoansScreen'));
const NotFoundScreen = lazy(() => import('@/shared/components/NotFoundScreen'));

export interface AppRoute {
  path: string;
  element: ReactElement;
}

export const APP_ROUTES: readonly AppRoute[] = [
  { path: HOME_PATH, element: <DashboardScreen /> },
  { path: CATALOG_PATH, element: <CatalogScreen /> },
  { path: BOOK_DETAIL_ROUTE, element: <BookDetailScreen /> },
  { path: READING_LIST_PATH, element: <ReadingListScreen /> },
  { path: LOGIN_PATH, element: <LoginScreen /> },
  { path: REGISTER_PATH, element: <RegisterScreen /> },
  {
    path: LOANS_PATH,
    element: (
      <ProtectedRoute>
        <LoansScreen />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFoundScreen /> },
];
