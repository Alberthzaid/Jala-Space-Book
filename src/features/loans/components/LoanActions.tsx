import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookUp, CalendarPlus, Hourglass, LogIn, RotateCcw, Undo2, X } from 'lucide-react';

import { buildLoginPath, useAuth } from '@/features/auth';
import SupabaseConfigNotice from '@/shared/components/SupabaseConfigNotice';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { formatFullDate } from '../api/availability';
import { canBorrow, canRenew, canReserve, daysLeft, isOverdue, type RuleResult } from '../lib/loanRules';
import type { ActionResult } from '../LoansProvider';
import type { LoanBook } from '../types';
import { useAvailability } from '../useAvailability';
import { useLoans } from '../useLoans';
import AvailabilityBadge from './AvailabilityBadge';

const PRIMARY_BUTTON =
  'w-full h-auto py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-none [&_svg]:size-4';
const SECONDARY_BUTTON =
  'w-full h-auto py-2.5 px-4 bg-surface-container-low text-primary hover:bg-surface-container hover:text-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 [&_svg]:size-4';

type Feedback = { tone: 'success' | 'error'; message: string } | null;

function RuleHint({ id, rule }: { id: string; rule: RuleResult }) {
  if (rule.allowed) return null;
  return (
    <p id={id} className="text-xs text-on-surface-variant">
      {rule.reason}
    </p>
  );
}

interface LoanActionsProps {
  book: LoanBook;
}

export default function LoanActions({ book }: LoanActionsProps) {
  const auth = useAuth();
  const loans = useLoans();
  const location = useLocation();
  const { availability, status, retry } = useAvailability([book.id]);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const info = availability[book.id];
  const myLoan = loans.getActiveLoan(book.id);
  const myReservation = loans.getActiveReservation(book.id);
  const pending = loans.pendingWorkId === book.id;
  const now = new Date();

  const run = async (action: () => Promise<ActionResult>, success: string) => {
    setFeedback(null);
    const result = await action();
    setFeedback(result.ok ? { tone: 'success', message: success } : { tone: 'error', message: result.error });
  };

  const shelf = {
    workId: book.id,
    availability: info,
    myActiveLoans: loans.activeLoans,
    myActiveReservations: loans.activeReservations,
  };

  const renderActions = () => {
    if (!auth.configured) return <SupabaseConfigNotice compact />;
    if (auth.loading) return null;
    if (!auth.user) {
      return (
        <Button asChild className={PRIMARY_BUTTON}>
          <Link to={buildLoginPath(`${location.pathname}${location.search}`)}>
            <LogIn aria-hidden="true" />
            Inicia sesión para pedirlo prestado
          </Link>
        </Button>
      );
    }

    if (loans.status === 'loading' || loans.status === 'idle') {
      return <p className="text-xs text-on-surface-variant">Cargando tus préstamos…</p>;
    }
    if (loans.status === 'error') {
      return (
        <div role="alert" className="flex items-center justify-between gap-2 text-xs text-error">
          <span>{loans.error}</span>
          <Button type="button" variant="ghost" onClick={loans.refresh} className="h-auto px-2 py-1 text-xs">
            Reintentar
          </Button>
        </div>
      );
    }

    if (myLoan) {
      const renewRule = canRenew(myLoan, info, now);
      const overdue = isOverdue(myLoan, now);
      const remaining = daysLeft(myLoan, now);
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-on-surface">
            Lo tienes en préstamo hasta el <strong>{formatFullDate(myLoan.dueAt)}</strong>
            {overdue ? (
              <span className="text-error font-semibold"> (vencido)</span>
            ) : (
              ` (${remaining === 1 ? 'queda 1 día' : `quedan ${remaining} días`})`
            )}
            .
          </p>
          <Button
            type="button"
            className={SECONDARY_BUTTON}
            disabled={pending || !renewRule.allowed}
            aria-describedby={renewRule.allowed ? undefined : 'renew-hint'}
            onClick={() => run(() => loans.renew(myLoan), 'Préstamo renovado por 7 días más.')}
          >
            <CalendarPlus aria-hidden="true" />
            Renovar 7 días
          </Button>
          <RuleHint id="renew-hint" rule={renewRule} />
          <Button
            type="button"
            className={PRIMARY_BUTTON}
            disabled={pending}
            onClick={() => run(() => loans.giveBack(myLoan), 'Libro devuelto. ¡Gracias!')}
          >
            <Undo2 aria-hidden="true" />
            Devolver
          </Button>
        </div>
      );
    }

    const borrowRule = canBorrow(shelf);
    const reserveRule = canReserve(shelf);
    const borrowButton = (
      <Button
        type="button"
        className={PRIMARY_BUTTON}
        disabled={pending}
        onClick={() => run(() => loans.borrow(book), 'Préstamo confirmado. Tienes 14 días para leerlo.')}
      >
        <BookUp aria-hidden="true" />
        Pedir prestado
      </Button>
    );

    if (myReservation) {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-on-surface flex items-center gap-1.5">
            <Hourglass className="size-4 text-outline" aria-hidden="true" />
            Reservaste este libro.
            {borrowRule.allowed ? ' Ya puedes pedirlo prestado.' : ' Te avisaremos cuando esté disponible.'}
          </p>
          {borrowRule.allowed && borrowButton}
          <Button
            type="button"
            className={SECONDARY_BUTTON}
            disabled={pending}
            onClick={() => run(() => loans.cancelReservation(myReservation), 'Reserva cancelada.')}
          >
            <X aria-hidden="true" />
            Cancelar reserva
          </Button>
        </div>
      );
    }

    if (borrowRule.allowed) return borrowButton;

    return (
      <div className="flex flex-col gap-2">
        <RuleHint id="borrow-hint" rule={borrowRule} />
        {reserveRule.allowed && (
          <Button
            type="button"
            className={PRIMARY_BUTTON}
            disabled={pending}
            onClick={() => run(() => loans.reserve(book), 'Reserva creada. Te avisaremos cuando esté disponible.')}
          >
            <Hourglass aria-hidden="true" />
            Reservar
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-surface-container-lowest rounded-xl border-0 p-4 shadow-sm flex flex-col gap-3" aria-labelledby="loan-panel-title">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 id="loan-panel-title" className="text-[11px] font-semibold text-outline uppercase tracking-wider">
          Préstamo
        </h2>
        {auth.configured && <AvailabilityBadge availability={info} />}
      </div>

      {auth.configured && status === 'error' && (
        <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant">
          <span>No pudimos consultar la disponibilidad.</span>
          <Button type="button" variant="ghost" onClick={retry} className="h-auto px-2 py-1 text-xs [&_svg]:size-3.5">
            <RotateCcw aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      )}

      {renderActions()}

      <div aria-live="polite">
        {feedback && (
          <p
            role={feedback.tone === 'error' ? 'alert' : undefined}
            className={feedback.tone === 'error' ? 'text-sm font-medium text-error' : 'text-sm font-medium text-primary'}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </Card>
  );
}
