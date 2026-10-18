import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import RouteSkeleton from '@/shared/components/RouteSkeleton';
import SupabaseConfigNotice from '@/shared/components/SupabaseConfigNotice';
import { buildLoginPath } from './lib/redirect';
import { useAuth } from './useAuth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { configured, loading, user } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-10">
        <SupabaseConfigNotice />
      </div>
    );
  }
  if (loading) return <RouteSkeleton />;
  if (!user) return <Navigate to={buildLoginPath(`${location.pathname}${location.search}`)} replace />;
  return <>{children}</>;
}
