import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  LOAN_COLUMNS,
  RESERVATION_COLUMNS,
  LoanError,
  borrowBook,
  cancelReservation,
  listMyLoans,
  listMyReservations,
  mapLoanError,
  markReservationNotified,
  renewLoan,
  reserveBook,
  returnLoan,
} from './loansRepository';

interface Call {
  method: string;
  args: unknown[];
}

const BUILDER_METHODS = ['select', 'insert', 'update', 'eq', 'is', 'order', 'single'] as const;

function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {};
  for (const method of BUILDER_METHODS) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  const client = {
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const loanRow = {
  id: 'l1',
  work_id: 'OL1W',
  title: 'Dune',
  authors: ['Frank Herbert'],
  cover_id: null,
  borrowed_at: '2026-10-17T12:00:00Z',
  due_at: '2026-10-31T12:00:00Z',
  renewed: false,
  returned_at: null,
};

const reservationRow = {
  id: 'r1',
  work_id: 'OL1W',
  title: 'Dune',
  authors: null,
  cover_id: 42,
  created_at: '2026-10-17T12:00:00Z',
  notified_at: null,
  fulfilled_at: null,
  cancelled_at: null,
};

const book = { id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'], coverId: 42 };

describe('listMyLoans', () => {
  it('queries the loans table newest first and maps rows', async () => {
    const { client, calls } = fakeClient({ data: [loanRow], error: null });
    const loans = await listMyLoans(client);
    expect(calls).toEqual([
      { method: 'from', args: ['loans'] },
      { method: 'select', args: [LOAN_COLUMNS] },
      { method: 'order', args: ['borrowed_at', { ascending: false }] },
    ]);
    expect(loans).toEqual([
      {
        id: 'l1',
        workId: 'OL1W',
        title: 'Dune',
        authors: ['Frank Herbert'],
        borrowedAt: '2026-10-17T12:00:00Z',
        dueAt: '2026-10-31T12:00:00Z',
        renewed: false,
        returnedAt: null,
      },
    ]);
  });

  it('throws a LoanError when the query fails', async () => {
    const { client } = fakeClient({ data: null, error: { code: 'PGRST301', message: 'JWT expired' } });
    await expect(listMyLoans(client)).rejects.toThrow('Tu sesión expiró. Inicia sesión de nuevo.');
  });
});

describe('listMyReservations', () => {
  it('queries reservations newest first and maps rows', async () => {
    const { client, calls } = fakeClient({ data: [reservationRow], error: null });
    const reservations = await listMyReservations(client);
    expect(calls).toEqual([
      { method: 'from', args: ['reservations'] },
      { method: 'select', args: [RESERVATION_COLUMNS] },
      { method: 'order', args: ['created_at', { ascending: false }] },
    ]);
    expect(reservations).toEqual([
      {
        id: 'r1',
        workId: 'OL1W',
        title: 'Dune',
        authors: [],
        coverId: 42,
        createdAt: '2026-10-17T12:00:00Z',
        notifiedAt: null,
        fulfilledAt: null,
        cancelledAt: null,
      },
    ]);
  });
});

describe('borrowBook', () => {
  it('inserts a snapshot of the book and returns the created loan', async () => {
    const { client, calls } = fakeClient({ data: loanRow, error: null });
    const created = await borrowBook(client, book);
    expect(calls).toEqual([
      { method: 'from', args: ['loans'] },
      { method: 'insert', args: [{ work_id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'], cover_id: 42 }] },
      { method: 'select', args: [LOAN_COLUMNS] },
      { method: 'single', args: [] },
    ]);
    expect(created.id).toBe('l1');
  });

  it('maps a unique violation to "already on loan"', async () => {
    const { client } = fakeClient({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "loans_one_active_copy_per_work"' },
    });
    const promise = borrowBook(client, book);
    await expect(promise).rejects.toBeInstanceOf(LoanError);
    await expect(promise).rejects.toThrow('Este libro ya está prestado');
  });

  it('maps the loan limit raised by the database', async () => {
    const { client } = fakeClient({ data: null, error: { code: 'P0001', message: 'LOAN_LIMIT_REACHED' } });
    await expect(borrowBook(client, book)).rejects.toThrow('Alcanzaste el máximo de 5 préstamos activos.');
  });

  it('maps a reserved book', async () => {
    const { client } = fakeClient({ data: null, error: { code: 'P0001', message: 'BOOK_RESERVED' } });
    await expect(borrowBook(client, book)).rejects.toThrow('Este libro está reservado por otro lector.');
  });

  it('rejects an invalid work id without calling Supabase', async () => {
    const { client, calls } = fakeClient({ data: loanRow, error: null });
    await expect(borrowBook(client, { ...book, id: '../etc' })).rejects.toThrow('Identificador de libro no válido.');
    expect(calls).toEqual([]);
  });
});

describe('renewLoan', () => {
  it('flags the active loan as renewed', async () => {
    const { client, calls } = fakeClient({ data: { ...loanRow, renewed: true }, error: null });
    const renewed = await renewLoan(client, 'l1');
    expect(calls).toEqual([
      { method: 'from', args: ['loans'] },
      { method: 'update', args: [{ renewed: true }] },
      { method: 'eq', args: ['id', 'l1'] },
      { method: 'is', args: ['returned_at', null] },
      { method: 'select', args: [LOAN_COLUMNS] },
      { method: 'single', args: [] },
    ]);
    expect(renewed.renewed).toBe(true);
  });

  it('maps renewal rule violations', async () => {
    const overdue = fakeClient({ data: null, error: { code: 'P0001', message: 'LOAN_OVERDUE' } });
    await expect(renewLoan(overdue.client, 'l1')).rejects.toThrow('No puedes renovar un préstamo vencido.');
    const reserved = fakeClient({ data: null, error: { code: 'P0001', message: 'BOOK_RESERVED' } });
    await expect(renewLoan(reserved.client, 'l1')).rejects.toThrow('No puedes renovar: otro lector reservó este libro.');
  });
});

describe('returnLoan', () => {
  it('sets the return date on the active loan', async () => {
    const { client, calls } = fakeClient({ data: { ...loanRow, returned_at: '2026-10-18T12:00:00Z' }, error: null });
    const returned = await returnLoan(client, 'l1');
    expect(calls[1]).toEqual({ method: 'update', args: [{ returned_at: expect.any(String) }] });
    expect(calls.slice(2, 4)).toEqual([
      { method: 'eq', args: ['id', 'l1'] },
      { method: 'is', args: ['returned_at', null] },
    ]);
    expect(returned.returnedAt).toBe('2026-10-18T12:00:00Z');
  });
});

describe('reserveBook', () => {
  it('inserts a reservation', async () => {
    const { client, calls } = fakeClient({ data: reservationRow, error: null });
    await reserveBook(client, book);
    expect(calls.slice(0, 2)).toEqual([
      { method: 'from', args: ['reservations'] },
      { method: 'insert', args: [{ work_id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'], cover_id: 42 }] },
    ]);
  });

  it('maps a duplicate reservation', async () => {
    const { client } = fakeClient({ data: null, error: { code: '23505', message: 'duplicate key' } });
    await expect(reserveBook(client, book)).rejects.toThrow('Ya reservaste este libro.');
  });

  it('maps reserving an available book', async () => {
    const { client } = fakeClient({ data: null, error: { code: 'P0001', message: 'BOOK_AVAILABLE' } });
    await expect(reserveBook(client, book)).rejects.toThrow('Este libro está disponible: puedes pedirlo prestado.');
  });
});

describe('cancelReservation', () => {
  it('sets the cancellation date on an open reservation', async () => {
    const { client, calls } = fakeClient({ data: { ...reservationRow, cancelled_at: '2026-10-18T12:00:00Z' }, error: null });
    await cancelReservation(client, 'r1');
    expect(calls.slice(0, 4)).toEqual([
      { method: 'from', args: ['reservations'] },
      { method: 'update', args: [{ cancelled_at: expect.any(String) }] },
      { method: 'eq', args: ['id', 'r1'] },
      { method: 'is', args: ['cancelled_at', null] },
    ]);
  });
});

describe('markReservationNotified', () => {
  it('only marks reservations that were not notified yet', async () => {
    const { client, calls } = fakeClient({ data: null, error: null });
    await markReservationNotified(client, 'r1');
    expect(calls).toEqual([
      { method: 'from', args: ['reservations'] },
      { method: 'update', args: [{ notified_at: expect.any(String) }] },
      { method: 'eq', args: ['id', 'r1'] },
      { method: 'is', args: ['notified_at', null] },
    ]);
  });
});

describe('mapLoanError', () => {
  it('maps network failures', () => {
    expect(mapLoanError(new TypeError('Failed to fetch'), 'borrow').message).toBe(
      'No pudimos conectar con el servidor. Revisa tu conexión.'
    );
  });

  it('maps a missing row', () => {
    expect(mapLoanError({ code: 'PGRST116', message: 'no rows' }, 'renew').message).toBe(
      'No encontramos el préstamo. Actualiza la página e inténtalo de nuevo.'
    );
  });

  it('falls back to a generic message', () => {
    expect(mapLoanError({ code: 'XX000', message: 'weird' }, 'borrow').message).toBe(
      'No pudimos completar la operación. Inténtalo de nuevo.'
    );
  });
});
