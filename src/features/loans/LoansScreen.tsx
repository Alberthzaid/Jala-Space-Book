import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookUp, CalendarPlus, Hourglass, Undo2, X } from 'lucide-react';

import BookCover from '@/shared/components/BookCover';
import ErrorState from '@/shared/components/ErrorState';
import LoadingGrid from '@/shared/components/LoadingGrid';
import { CATALOG_PATH, getBookDetailPath } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { formatFullDate } from './api/availability';
import AvailabilityBadge from './components/AvailabilityBadge';
import { MAX_ACTIVE_LOANS, canBorrow, canRenew, daysLeft, isOverdue } from './lib/loanRules';
import type { ActionResult } from './LoansProvider';
import type { Loan, Reservation } from './types';
import { useAvailability } from './useAvailability';
import { useLoans } from './useLoans';

type TabId = 'active' | 'reservations' | 'history';
const TAB_IDS: readonly TabId[] = ['active', 'reservations', 'history'];
const isTabId = (value: string): value is TabId => TAB_IDS.some((id) => id === value);

const ACTION_BUTTON =
  'h-auto py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 [&_svg]:size-3.5';

interface ItemCardProps {
  workId: string;
  title: string;
  authors: readonly string[];
  coverId?: number;
  children: ReactNode;
}

function ItemCard({ workId, title, authors, coverId, children }: ItemCardProps) {
  const detailPath = getBookDetailPath(workId);
  return (
    <li>
      <Card className="p-3 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex gap-4 items-start">
        <Link to={detailPath} tabIndex={-1} aria-hidden="true" className="w-16 shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
          <BookCover title={title} coverId={coverId} size="S" />
        </Link>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-primary leading-snug line-clamp-2">
              <Link to={detailPath} className="rounded hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                {title}
              </Link>
            </h3>
            <p className="text-xs text-on-surface-variant truncate">
              {authors.length > 0 ? authors.join(', ') : 'Autor desconocido'}
            </p>
          </div>
          {children}
        </div>
      </Card>
    </li>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <Card className="p-8 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col items-center text-center gap-3">
      <p className="text-sm text-on-surface-variant max-w-md">{message}</p>
      <Button asChild className="h-auto px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-none hover:bg-primary-container">
        <Link to={CATALOG_PATH}>Explorar catálogo</Link>
      </Button>
    </Card>
  );
}

export default function LoansScreen() {
  const loans = useLoans();
  const [tab, setTab] = useState<TabId>('active');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const watchedIds = [...loans.activeLoans.map((loan) => loan.workId), ...loans.activeReservations.map((item) => item.workId)];
  const { availability } = useAvailability(watchedIds);
  const now = new Date();

  const run = async (action: () => Promise<ActionResult>, success: string) => {
    setFeedback(null);
    const result = await action();
    setFeedback(result.ok ? { tone: 'success', message: success } : { tone: 'error', message: result.error });
  };

  const renderLoan = (loan: Loan) => {
    const renewRule = canRenew(loan, availability[loan.workId], now);
    const overdue = isOverdue(loan, now);
    const remaining = daysLeft(loan, now);
    const pending = loans.pendingWorkId === loan.workId;
    const hintId = `renew-hint-${loan.id}`;
    return (
      <ItemCard key={loan.id} workId={loan.workId} title={loan.title} authors={loan.authors} coverId={loan.coverId}>
        <p className={overdue ? 'text-xs font-semibold text-error' : 'text-xs text-on-surface'}>
          Vence el {formatFullDate(loan.dueAt)} ·{' '}
          {overdue
            ? `vencido hace ${Math.abs(remaining) || 1} ${Math.abs(remaining) === 1 ? 'día' : 'días'}`
            : remaining === 1
              ? 'queda 1 día'
              : `quedan ${remaining} días`}
          {loan.renewed && ' · renovado'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={pending || !renewRule.allowed}
            aria-describedby={renewRule.allowed ? undefined : hintId}
            onClick={() => run(() => loans.renew(loan), `«${loan.title}» renovado por 7 días más.`)}
            className={`${ACTION_BUTTON} bg-surface-container-low text-primary hover:bg-surface-container`}
          >
            <CalendarPlus aria-hidden="true" />
            Renovar
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => loans.giveBack(loan), `«${loan.title}» devuelto.`)}
            className={`${ACTION_BUTTON} bg-primary text-on-primary hover:bg-primary-container shadow-none`}
          >
            <Undo2 aria-hidden="true" />
            Devolver
          </Button>
        </div>
        {!renewRule.allowed && (
          <p id={hintId} className="text-[11px] text-on-surface-variant">
            {renewRule.reason}
          </p>
        )}
      </ItemCard>
    );
  };

  const renderReservation = (reservation: Reservation) => {
    const info = availability[reservation.workId];
    const pending = loans.pendingWorkId === reservation.workId;
    const borrowRule = canBorrow({
      workId: reservation.workId,
      availability: info,
      myActiveLoans: loans.activeLoans,
      myActiveReservations: loans.activeReservations,
    });
    const readyToBorrow = info !== undefined && !info.onLoan;
    return (
      <ItemCard
        key={reservation.id}
        workId={reservation.workId}
        title={reservation.title}
        authors={reservation.authors}
        coverId={reservation.coverId}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface">
          <span>Reservado el {formatFullDate(reservation.createdAt)}</span>
          <AvailabilityBadge availability={info} />
        </div>
        <div className="flex flex-wrap gap-2">
          {readyToBorrow && borrowRule.allowed && (
            <Button
              type="button"
              disabled={pending}
              onClick={() => run(() => loans.borrow({ id: reservation.workId, title: reservation.title, authors: reservation.authors, coverId: reservation.coverId }), `Préstamo de «${reservation.title}» confirmado.`)}
              className={`${ACTION_BUTTON} bg-primary text-on-primary hover:bg-primary-container shadow-none`}
            >
              <BookUp aria-hidden="true" />
              Pedir prestado
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => loans.cancelReservation(reservation), 'Reserva cancelada.')}
            className={`${ACTION_BUTTON} bg-surface-container-low text-on-surface hover:bg-surface-container`}
          >
            <X aria-hidden="true" />
            Cancelar reserva
          </Button>
        </div>
        {readyToBorrow && !borrowRule.allowed && (
          <p className="text-[11px] text-on-surface-variant">{borrowRule.reason}</p>
        )}
      </ItemCard>
    );
  };

  const renderHistory = (loan: Loan) => (
    <ItemCard key={loan.id} workId={loan.workId} title={loan.title} authors={loan.authors} coverId={loan.coverId}>
      <p className="text-xs text-on-surface-variant">
        Prestado el {formatFullDate(loan.borrowedAt)} · devuelto el {formatFullDate(loan.returnedAt ?? loan.dueAt)}
      </p>
    </ItemCard>
  );

  const tabs: { id: TabId; label: string; count: number; content: ReactNode }[] = [
    {
      id: 'active',
      label: 'Activos',
      count: loans.activeLoans.length,
      content:
        loans.activeLoans.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">{loans.activeLoans.map(renderLoan)}</ul>
        ) : (
          <EmptyTab message="No tienes préstamos activos. Busca un libro y pídelo prestado desde su ficha." />
        ),
    },
    {
      id: 'reservations',
      label: 'Reservas',
      count: loans.activeReservations.length,
      content:
        loans.activeReservations.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">{loans.activeReservations.map(renderReservation)}</ul>
        ) : (
          <EmptyTab message="No tienes reservas. Puedes reservar un libro cuando otra persona lo tiene prestado." />
        ),
    },
    {
      id: 'history',
      label: 'Historial',
      count: loans.history.length,
      content:
        loans.history.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">{loans.history.map(renderHistory)}</ul>
        ) : (
          <EmptyTab message="Todavía no devolviste ningún libro." />
        ),
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Mis préstamos</h1>
          <p className="text-base text-on-surface-variant">
            Préstamos de 14 días con una renovación de 7 días. Puedes tener hasta {MAX_ACTIVE_LOANS} libros a la vez.
          </p>
        </header>

        <div aria-live="polite">
          {feedback && (
            <p
              role={feedback.tone === 'error' ? 'alert' : undefined}
              className={
                feedback.tone === 'error'
                  ? 'p-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium'
                  : 'p-3 rounded-xl bg-secondary-fixed text-primary text-sm font-medium'
              }
            >
              {feedback.message}
            </p>
          )}
        </div>

        {loans.status === 'error' && (
          <ErrorState
            title="No pudimos cargar tus préstamos"
            description={loans.error ?? undefined}
            onRetry={loans.refresh}
          />
        )}
        {(loans.status === 'loading' || loans.status === 'idle') && <LoadingGrid count={4} label="Cargando tus préstamos…" />}
        {loans.status === 'ready' && (
          <Tabs value={tab} onValueChange={(value) => isTabId(value) && setTab(value)}>
            <TabsList className="h-auto w-full sm:w-auto grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl text-on-surface-variant">
              {tabs.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="py-2 px-3 rounded-lg text-sm font-semibold gap-2 data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  {item.id === 'reservations' && <Hourglass className="size-4" aria-hidden="true" />}
                  <span>{item.label}</span>
                  <span className="text-xs font-bold px-1.5 rounded-full bg-surface-container text-on-surface-variant">
                    {item.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((item) => (
              <TabsContent key={item.id} value={item.id} className="mt-4">
                {item.content}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
