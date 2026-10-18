import type { SupabaseClient } from '@supabase/supabase-js';

import { isValidWorkId } from '@/shared/api/openLibrary';
import type { Loan, LoanBook, Reservation } from '../types';

export const LOAN_COLUMNS = 'id,work_id,title,authors,cover_id,borrowed_at,due_at,renewed,returned_at';
export const RESERVATION_COLUMNS = 'id,work_id,title,authors,cover_id,created_at,notified_at,fulfilled_at,cancelled_at';

export type LoanOperation = 'list' | 'borrow' | 'renew' | 'return' | 'reserve' | 'cancel' | 'notify';

export class LoanError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'LoanError';
    this.code = code;
  }
}

const GENERIC_MESSAGE = 'No pudimos completar la operación. Inténtalo de nuevo.';
const NETWORK_MESSAGE = 'No pudimos conectar con el servidor. Revisa tu conexión.';
const SESSION_MESSAGE = 'Tu sesión expiró. Inicia sesión de nuevo.';

const RULE_MESSAGES: Readonly<Record<string, string>> = {
  LOAN_LIMIT_REACHED: 'Alcanzaste el máximo de 5 préstamos activos.',
  LOAN_OVERDUE: 'No puedes renovar un préstamo vencido.',
  LOAN_CLOSED: 'Este préstamo ya fue devuelto.',
  ALREADY_HOLDING: 'Ya tienes este libro en préstamo.',
  BOOK_AVAILABLE: 'Este libro está disponible: puedes pedirlo prestado.',
  RESERVATION_CLOSED: 'Esta reserva ya no está activa.',
  AUTH_REQUIRED: SESSION_MESSAGE,
};

function readString(error: unknown, field: string): string | undefined {
  if (error === null || typeof error !== 'object' || !(field in error)) return undefined;
  const value = (error as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

export function mapLoanError(error: unknown, operation: LoanOperation): LoanError {
  if (error instanceof LoanError) return error;
  const code = readString(error, 'code');
  const message = readString(error, 'message') ?? '';

  if (error instanceof TypeError || /failed to fetch|network/i.test(message)) return new LoanError(NETWORK_MESSAGE, code);
  if (code === '23505') {
    return new LoanError(operation === 'reserve' ? 'Ya reservaste este libro.' : 'Este libro ya está prestado.', code);
  }
  if (message.includes('BOOK_RESERVED')) {
    return new LoanError(
      operation === 'renew' ? 'No puedes renovar: otro lector reservó este libro.' : 'Este libro está reservado por otro lector.',
      code
    );
  }
  const ruleKey = Object.keys(RULE_MESSAGES).find((key) => message.includes(key));
  if (ruleKey) return new LoanError(RULE_MESSAGES[ruleKey]!, code);
  if (code === '42501' || code === 'PGRST301' || /jwt/i.test(message)) return new LoanError(SESSION_MESSAGE, code);
  if (code === 'PGRST116') {
    const subject = operation === 'reserve' || operation === 'cancel' ? 'la reserva' : 'el préstamo';
    return new LoanError(`No encontramos ${subject}. Actualiza la página e inténtalo de nuevo.`, code);
  }
  return new LoanError(GENERIC_MESSAGE, code);
}

interface LoanRow {
  id: string;
  work_id: string;
  title: string;
  authors: string[] | null;
  cover_id: number | null;
  borrowed_at: string;
  due_at: string;
  renewed: boolean;
  returned_at: string | null;
}

interface ReservationRow {
  id: string;
  work_id: string;
  title: string;
  authors: string[] | null;
  cover_id: number | null;
  created_at: string;
  notified_at: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
}

export function toLoan(row: LoanRow): Loan {
  const loan: Loan = {
    id: row.id,
    workId: row.work_id,
    title: row.title,
    authors: row.authors ?? [],
    borrowedAt: row.borrowed_at,
    dueAt: row.due_at,
    renewed: row.renewed,
    returnedAt: row.returned_at,
  };
  if (typeof row.cover_id === 'number') loan.coverId = row.cover_id;
  return loan;
}

export function toReservation(row: ReservationRow): Reservation {
  const reservation: Reservation = {
    id: row.id,
    workId: row.work_id,
    title: row.title,
    authors: row.authors ?? [],
    createdAt: row.created_at,
    notifiedAt: row.notified_at,
    fulfilledAt: row.fulfilled_at,
    cancelledAt: row.cancelled_at,
  };
  if (typeof row.cover_id === 'number') reservation.coverId = row.cover_id;
  return reservation;
}

function toSnapshot(book: LoanBook) {
  if (!isValidWorkId(book.id)) throw new LoanError('Identificador de libro no válido.');
  return {
    work_id: book.id,
    title: book.title.slice(0, 500),
    authors: book.authors.slice(0, 20),
    cover_id: book.coverId ?? null,
  };
}

interface QueryResult<T> {
  data: T | null;
  error: unknown;
}

async function run<T>(operation: LoanOperation, query: PromiseLike<QueryResult<T>>): Promise<T> {
  let result: QueryResult<T>;
  try {
    result = await query;
  } catch (error) {
    throw mapLoanError(error, operation);
  }
  if (result.error) throw mapLoanError(result.error, operation);
  if (result.data === null) throw mapLoanError({ code: 'PGRST116' }, operation);
  return result.data;
}

const nowIso = () => new Date().toISOString();

export async function listMyLoans(client: SupabaseClient): Promise<Loan[]> {
  const rows = await run<LoanRow[]>(
    'list',
    client.from('loans').select(LOAN_COLUMNS).order('borrowed_at', { ascending: false })
  );
  return rows.map(toLoan);
}

export async function listMyReservations(client: SupabaseClient): Promise<Reservation[]> {
  const rows = await run<ReservationRow[]>(
    'list',
    client.from('reservations').select(RESERVATION_COLUMNS).order('created_at', { ascending: false })
  );
  return rows.map(toReservation);
}

export async function borrowBook(client: SupabaseClient, book: LoanBook): Promise<Loan> {
  const snapshot = toSnapshot(book);
  const row = await run<LoanRow>('borrow', client.from('loans').insert(snapshot).select(LOAN_COLUMNS).single());
  return toLoan(row);
}

export async function renewLoan(client: SupabaseClient, loanId: string): Promise<Loan> {
  const row = await run<LoanRow>(
    'renew',
    client.from('loans').update({ renewed: true }).eq('id', loanId).is('returned_at', null).select(LOAN_COLUMNS).single()
  );
  return toLoan(row);
}

export async function returnLoan(client: SupabaseClient, loanId: string): Promise<Loan> {
  const row = await run<LoanRow>(
    'return',
    client
      .from('loans')
      .update({ returned_at: nowIso() })
      .eq('id', loanId)
      .is('returned_at', null)
      .select(LOAN_COLUMNS)
      .single()
  );
  return toLoan(row);
}

export async function reserveBook(client: SupabaseClient, book: LoanBook): Promise<Reservation> {
  const snapshot = toSnapshot(book);
  const row = await run<ReservationRow>(
    'reserve',
    client.from('reservations').insert(snapshot).select(RESERVATION_COLUMNS).single()
  );
  return toReservation(row);
}

export async function cancelReservation(client: SupabaseClient, reservationId: string): Promise<Reservation> {
  const row = await run<ReservationRow>(
    'cancel',
    client
      .from('reservations')
      .update({ cancelled_at: nowIso() })
      .eq('id', reservationId)
      .is('cancelled_at', null)
      .select(RESERVATION_COLUMNS)
      .single()
  );
  return toReservation(row);
}

export async function markReservationNotified(client: SupabaseClient, reservationId: string): Promise<void> {
  let result: { error: unknown };
  try {
    result = await client
      .from('reservations')
      .update({ notified_at: nowIso() })
      .eq('id', reservationId)
      .is('notified_at', null);
  } catch (error) {
    throw mapLoanError(error, 'notify');
  }
  if (result.error) throw mapLoanError(result.error, 'notify');
}
