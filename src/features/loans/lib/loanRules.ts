export const LOAN_PERIOD_DAYS = 14;
export const RENEWAL_DAYS = 7;
export const MAX_ACTIVE_LOANS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LoanLike {
  workId: string;
  dueAt: string;
  renewed: boolean;
  returnedAt: string | null;
}

export interface AvailabilityLike {
  onLoan: boolean;
  reservationsCount: number;
}

export interface ShelfContext {
  workId: string;
  availability: AvailabilityLike | undefined;
  myActiveLoans: readonly { workId: string }[];
  myActiveReservations: readonly { workId: string }[];
}

export type RuleResult = { allowed: true } | { allowed: false; reason: string };

const ALLOWED: RuleResult = { allowed: true };
const deny = (reason: string): RuleResult => ({ allowed: false, reason });

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function computeDueDate(borrowedAt: Date): Date {
  return addDays(borrowedAt, LOAN_PERIOD_DAYS);
}

export function renewedDueDate(loan: Pick<LoanLike, 'dueAt'>): Date {
  return addDays(new Date(loan.dueAt), RENEWAL_DAYS);
}

export function isActiveLoan(loan: Pick<LoanLike, 'returnedAt'>): boolean {
  return loan.returnedAt === null;
}

export function isOverdue(loan: Pick<LoanLike, 'dueAt' | 'returnedAt'>, now: Date): boolean {
  return isActiveLoan(loan) && now.getTime() > new Date(loan.dueAt).getTime();
}

export function daysLeft(loan: Pick<LoanLike, 'dueAt'>, now: Date): number {
  const days = Math.ceil((new Date(loan.dueAt).getTime() - now.getTime()) / DAY_MS);
  return days === 0 ? 0 : days;
}

const holds = (list: readonly { workId: string }[], workId: string) => list.some((item) => item.workId === workId);

export function canBorrow({ workId, availability, myActiveLoans, myActiveReservations }: ShelfContext): RuleResult {
  if (holds(myActiveLoans, workId)) return deny('Ya tienes este libro en préstamo.');
  if (availability?.onLoan) return deny('Este libro ya está prestado.');
  if (myActiveLoans.length >= MAX_ACTIVE_LOANS) {
    return deny(`Alcanzaste el máximo de ${MAX_ACTIVE_LOANS} préstamos activos.`);
  }
  if (availability && availability.reservationsCount > 0 && !holds(myActiveReservations, workId)) {
    return deny('Este libro está reservado por otro lector.');
  }
  return ALLOWED;
}

export function canRenew(loan: LoanLike, availability: AvailabilityLike | undefined, now: Date): RuleResult {
  if (!isActiveLoan(loan)) return deny('Este préstamo ya fue devuelto.');
  if (loan.renewed) return deny('Ya renovaste este préstamo una vez.');
  if (isOverdue(loan, now)) return deny('No puedes renovar un préstamo vencido.');
  if (availability && availability.reservationsCount > 0) return deny('No puedes renovar: otro lector reservó este libro.');
  return ALLOWED;
}

export function canReserve({ workId, availability, myActiveLoans, myActiveReservations }: ShelfContext): RuleResult {
  if (holds(myActiveLoans, workId)) return deny('Ya tienes este libro en préstamo.');
  if (holds(myActiveReservations, workId)) return deny('Ya reservaste este libro.');
  if (!availability) return deny('No pudimos comprobar la disponibilidad.');
  if (!availability.onLoan && availability.reservationsCount === 0) {
    return deny('Este libro está disponible: puedes pedirlo prestado.');
  }
  return ALLOWED;
}
