import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import {
  borrowBook,
  cancelReservation as cancelReservationRequest,
  listMyLoans,
  listMyReservations,
  mapLoanError,
  markReservationNotified,
  renewLoan,
  reserveBook,
  returnLoan,
  type LoanOperation,
} from './api/loansRepository';
import type { Loan, LoanBook, Reservation } from './types';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type LoansStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LoansContextValue {
  configured: boolean;
  status: LoansStatus;
  error: string | null;
  activeLoans: readonly Loan[];
  history: readonly Loan[];
  activeReservations: readonly Reservation[];
  version: number;
  pendingWorkId: string | null;
  refresh: () => void;
  borrow: (book: LoanBook) => Promise<ActionResult>;
  renew: (loan: Loan) => Promise<ActionResult>;
  giveBack: (loan: Loan) => Promise<ActionResult>;
  reserve: (book: LoanBook) => Promise<ActionResult>;
  cancelReservation: (reservation: Reservation) => Promise<ActionResult>;
  markNotified: (reservationId: string) => void;
  getActiveLoan: (workId: string) => Loan | undefined;
  getActiveReservation: (workId: string) => Reservation | undefined;
}

export const LoansContext = createContext<LoansContextValue | null>(null);

const EMPTY_LOANS: readonly Loan[] = [];
const EMPTY_RESERVATIONS: readonly Reservation[] = [];

export default function LoansProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loans, setLoans] = useState<readonly Loan[]>(EMPTY_LOANS);
  const [reservations, setReservations] = useState<readonly Reservation[]>(EMPTY_RESERVATIONS);
  const [status, setStatus] = useState<LoansStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingWorkId, setPendingWorkId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoans(EMPTY_LOANS);
      setReservations(EMPTY_RESERVATIONS);
      setStatus('idle');
      setError(null);
      return undefined;
    }
    const client = supabase;
    let cancelled = false;
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    Promise.all([listMyLoans(client), listMyReservations(client)]).then(
      ([nextLoans, nextReservations]) => {
        if (cancelled) return;
        setLoans(nextLoans);
        setReservations(nextReservations);
        setStatus('ready');
        setError(null);
      },
      (reason: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(mapLoanError(reason, 'list').message);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const runAction = useCallback(
    async (
      operation: LoanOperation,
      workId: string,
      action: (client: SupabaseClient) => Promise<unknown>
    ): Promise<ActionResult> => {
      if (!supabase || !userId) return { ok: false, error: 'Inicia sesión para continuar.' };
      setPendingWorkId(workId);
      try {
        await action(supabase);
        return { ok: true };
      } catch (reason) {
        return { ok: false, error: mapLoanError(reason, operation).message };
      } finally {
        setPendingWorkId(null);
        setVersion((current) => current + 1);
        setReloadKey((key) => key + 1);
      }
    },
    [userId]
  );

  const borrow = useCallback(
    (book: LoanBook) => runAction('borrow', book.id, (client) => borrowBook(client, book)),
    [runAction]
  );
  const renew = useCallback(
    (loan: Loan) => runAction('renew', loan.workId, (client) => renewLoan(client, loan.id)),
    [runAction]
  );
  const giveBack = useCallback(
    (loan: Loan) => runAction('return', loan.workId, (client) => returnLoan(client, loan.id)),
    [runAction]
  );
  const reserve = useCallback(
    (book: LoanBook) => runAction('reserve', book.id, (client) => reserveBook(client, book)),
    [runAction]
  );
  const cancelReservation = useCallback(
    (reservation: Reservation) =>
      runAction('cancel', reservation.workId, (client) => cancelReservationRequest(client, reservation.id)),
    [runAction]
  );

  const markNotified = useCallback((reservationId: string) => {
    if (!supabase) return;
    const notifiedAt = new Date().toISOString();
    setReservations((current) =>
      current.map((item) => (item.id === reservationId ? { ...item, notifiedAt } : item))
    );
    markReservationNotified(supabase, reservationId).catch(() => undefined);
  }, []);

  const activeLoans = useMemo(() => loans.filter((loan) => loan.returnedAt === null), [loans]);
  const history = useMemo(() => loans.filter((loan) => loan.returnedAt !== null), [loans]);
  const activeReservations = useMemo(
    () => reservations.filter((item) => item.fulfilledAt === null && item.cancelledAt === null),
    [reservations]
  );

  const getActiveLoan = useCallback(
    (workId: string) => activeLoans.find((loan) => loan.workId === workId),
    [activeLoans]
  );
  const getActiveReservation = useCallback(
    (workId: string) => activeReservations.find((item) => item.workId === workId),
    [activeReservations]
  );

  const value = useMemo<LoansContextValue>(
    () => ({
      configured: supabase !== null,
      status,
      error,
      activeLoans,
      history,
      activeReservations,
      version,
      pendingWorkId,
      refresh,
      borrow,
      renew,
      giveBack,
      reserve,
      cancelReservation,
      markNotified,
      getActiveLoan,
      getActiveReservation,
    }),
    [
      status,
      error,
      activeLoans,
      history,
      activeReservations,
      version,
      pendingWorkId,
      refresh,
      borrow,
      renew,
      giveBack,
      reserve,
      cancelReservation,
      markNotified,
      getActiveLoan,
      getActiveReservation,
    ]
  );

  return <LoansContext.Provider value={value}>{children}</LoansContext.Provider>;
}
