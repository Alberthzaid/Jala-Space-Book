import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, UserRound } from 'lucide-react';

import { HOME_PATH, LOANS_PATH } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import { buildLoginPath } from '../lib/redirect';
import { useAuth } from '../useAuth';

export default function UserMenu() {
  const { configured, loading, user, displayName, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  if (!configured || loading) return null;

  if (!user) {
    return (
      <Button
        asChild
        className="h-9 px-3 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-none hover:bg-primary-container [&_svg]:size-4"
      >
        <Link to={buildLoginPath(`${location.pathname}${location.search}`)}>
          <LogIn aria-hidden="true" />
          Iniciar sesión
        </Link>
      </Button>
    );
  }

  const handleSignOut = async () => {
    setPending(true);
    await signOut();
    setPending(false);
    if (location.pathname === LOANS_PATH) navigate(HOME_PATH, { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="hidden lg:flex items-center gap-1.5 text-sm text-on-surface-variant max-w-[200px]">
        <UserRound className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate" title={user.email ?? undefined}>
          {displayName ?? user.email}
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={handleSignOut}
        disabled={pending}
        className="h-9 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm font-semibold hover:bg-surface-container [&_svg]:size-4"
      >
        <LogOut aria-hidden="true" />
        Cerrar sesión
      </Button>
    </div>
  );
}
