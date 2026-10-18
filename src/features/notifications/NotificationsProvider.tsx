import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth';
import { fetchAvailability, useLoans } from '@/features/loans';
import { useReadingList } from '@/features/reading-list';
import { supabase } from '@/shared/api/supabase';
import { useVisiblePolling } from '@/shared/hooks/useVisiblePolling';
import { computeAvailabilityNotices, type AvailabilityNotice } from './lib/availabilityNotices';
import { getBrowserStorage, loadWatchedOnLoan, saveWatchedOnLoan } from './lib/watchStorage';

export const POLL_INTERVAL_MS = 60_000;

export interface NotificationsContextValue {
  notices: readonly AvailabilityNotice[];
  dismiss: (key: string) => void;
  dismissAll: () => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export default function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { activeReservations, activeLoans, markNotified, status: loansStatus } = useLoans();
  const { entries } = useReadingList();
  const [notices, setNotices] = useState<AvailabilityNotice[]>([]);
  const notifiedKeys = useRef(new Set<string>());
  const inFlight = useRef(false);

  const reservations = useMemo(
    () => (user ? activeReservations.map(({ id, workId, title, notifiedAt }) => ({ id, workId, title, notifiedAt })) : []),
    [user, activeReservations]
  );
  const wantItems = useMemo(
    () => entries.filter((entry) => entry.status === 'want').map(({ book }) => ({ workId: book.id, title: book.title })),
    [entries]
  );
  const heldWorkIds = useMemo(() => new Set(activeLoans.map((loan) => loan.workId)), [activeLoans]);

  const check = useCallback(async () => {
    if (!supabase || inFlight.current) return;
    if (authLoading || (user && loansStatus !== 'ready')) return;
    const pendingReservations = reservations.filter((item) => !item.notifiedAt);
    const ids = [...pendingReservations.map((item) => item.workId), ...wantItems.map((item) => item.workId)];
    if (ids.length === 0) return;

    inFlight.current = true;
    try {
      const availability = await fetchAvailability(supabase, ids);
      const storage = getBrowserStorage();
      const result = computeAvailabilityNotices({
        reservations: pendingReservations,
        wantItems,
        availability,
        previouslyOnLoan: loadWatchedOnLoan(storage),
        heldWorkIds,
        alreadyNotified: notifiedKeys.current,
      });
      saveWatchedOnLoan(storage, result.watchedOnLoan);
      if (result.notices.length === 0) return;
      result.notices.forEach((notice) => {
        notifiedKeys.current.add(notice.key);
        if (notice.kind === 'reservation') markNotified(notice.reservationId);
      });
      setNotices((current) => [...result.notices, ...current]);
    } catch {
    } finally {
      inFlight.current = false;
    }
  }, [authLoading, user, loansStatus, reservations, wantItems, heldWorkIds, markNotified]);

  useVisiblePolling(check, POLL_INTERVAL_MS, supabase !== null);

  const readyKey = user && loansStatus === 'ready' ? user.id : null;
  const checkRef = useRef(check);
  checkRef.current = check;
  useEffect(() => {
    if (readyKey) void checkRef.current();
  }, [readyKey]);

  const dismiss = useCallback((key: string) => setNotices((current) => current.filter((notice) => notice.key !== key)), []);
  const dismissAll = useCallback(() => setNotices([]), []);

  const value = useMemo(() => ({ notices, dismiss, dismissAll }), [notices, dismiss, dismissAll]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
