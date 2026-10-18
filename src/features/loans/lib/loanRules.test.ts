import { describe, expect, it } from 'vitest';

import {
  LOAN_PERIOD_DAYS,
  MAX_ACTIVE_LOANS,
  RENEWAL_DAYS,
  canBorrow,
  canRenew,
  canReserve,
  computeDueDate,
  daysLeft,
  isOverdue,
  renewedDueDate,
  type LoanLike,
} from './loanRules';

const NOW = new Date('2026-10-17T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function iso(offsetMs: number): string {
  return new Date(NOW.getTime() + offsetMs).toISOString();
}

function loan(overrides: Partial<LoanLike> = {}): LoanLike {
  return { workId: 'OL1W', dueAt: iso(10 * DAY), renewed: false, returnedAt: null, ...overrides };
}

const available = { onLoan: false, reservationsCount: 0 };
const onLoan = { onLoan: true, reservationsCount: 0 };

describe('constants', () => {
  it('match the library policy', () => {
    expect(LOAN_PERIOD_DAYS).toBe(14);
    expect(RENEWAL_DAYS).toBe(7);
    expect(MAX_ACTIVE_LOANS).toBe(5);
  });
});

describe('computeDueDate / renewedDueDate', () => {
  it('adds 14 days to the borrow date', () => {
    expect(computeDueDate(NOW).toISOString()).toBe('2026-10-31T12:00:00.000Z');
  });

  it('adds 7 days to the current due date on renewal', () => {
    expect(renewedDueDate(loan({ dueAt: '2026-10-20T12:00:00.000Z' })).toISOString()).toBe('2026-10-27T12:00:00.000Z');
  });
});

describe('isOverdue', () => {
  it('is true after the due date for an active loan', () => {
    expect(isOverdue(loan({ dueAt: iso(-1000) }), NOW)).toBe(true);
    expect(isOverdue(loan({ dueAt: iso(1000) }), NOW)).toBe(false);
  });

  it('is never true for a returned loan', () => {
    expect(isOverdue(loan({ dueAt: iso(-DAY), returnedAt: iso(-1000) }), NOW)).toBe(false);
  });
});

describe('daysLeft', () => {
  it('rounds partial days up', () => {
    expect(daysLeft(loan({ dueAt: iso(3 * DAY) }), NOW)).toBe(3);
    expect(daysLeft(loan({ dueAt: iso(2.5 * DAY) }), NOW)).toBe(3);
  });

  it('is zero on the due instant and negative when overdue', () => {
    expect(daysLeft(loan({ dueAt: iso(0) }), NOW)).toBe(0);
    expect(daysLeft(loan({ dueAt: iso(-DAY) }), NOW)).toBe(-1);
  });
});

describe('canBorrow', () => {
  const base = { workId: 'OL1W', myActiveLoans: [], myActiveReservations: [] };

  it('allows borrowing an available book', () => {
    expect(canBorrow({ ...base, availability: available })).toEqual({ allowed: true });
  });

  it('allows borrowing when availability is unknown (the database still enforces it)', () => {
    expect(canBorrow({ ...base, availability: undefined })).toEqual({ allowed: true });
  });

  it('rejects a book the user already holds', () => {
    expect(canBorrow({ ...base, availability: onLoan, myActiveLoans: [{ workId: 'OL1W' }] })).toEqual({
      allowed: false,
      reason: 'Ya tienes este libro en préstamo.',
    });
  });

  it('rejects a book someone else holds', () => {
    expect(canBorrow({ ...base, availability: onLoan })).toEqual({ allowed: false, reason: 'Este libro ya está prestado.' });
  });

  it('rejects when the user reached the active loan limit', () => {
    const myActiveLoans = ['OL2W', 'OL3W', 'OL4W', 'OL5W', 'OL6W'].map((workId) => ({ workId }));
    expect(canBorrow({ ...base, availability: available, myActiveLoans })).toEqual({
      allowed: false,
      reason: 'Alcanzaste el máximo de 5 préstamos activos.',
    });
  });

  it('rejects a returned book that other readers reserved', () => {
    expect(canBorrow({ ...base, availability: { onLoan: false, reservationsCount: 1 } })).toEqual({
      allowed: false,
      reason: 'Este libro está reservado por otro lector.',
    });
  });

  it('allows a reserved book to the reader who reserved it', () => {
    expect(
      canBorrow({
        ...base,
        availability: { onLoan: false, reservationsCount: 1 },
        myActiveReservations: [{ workId: 'OL1W' }],
      })
    ).toEqual({ allowed: true });
  });
});

describe('canRenew', () => {
  it('allows one renewal of an active loan', () => {
    expect(canRenew(loan(), available, NOW)).toEqual({ allowed: true });
  });

  it('rejects a second renewal', () => {
    expect(canRenew(loan({ renewed: true }), available, NOW)).toEqual({
      allowed: false,
      reason: 'Ya renovaste este préstamo una vez.',
    });
  });

  it('rejects an overdue loan', () => {
    expect(canRenew(loan({ dueAt: iso(-1000) }), available, NOW)).toEqual({
      allowed: false,
      reason: 'No puedes renovar un préstamo vencido.',
    });
  });

  it('rejects when another reader reserved the book', () => {
    expect(canRenew(loan(), { onLoan: true, reservationsCount: 2 }, NOW)).toEqual({
      allowed: false,
      reason: 'No puedes renovar: otro lector reservó este libro.',
    });
  });

  it('rejects a returned loan', () => {
    expect(canRenew(loan({ returnedAt: iso(-1000) }), available, NOW)).toEqual({
      allowed: false,
      reason: 'Este préstamo ya fue devuelto.',
    });
  });
});

describe('canReserve', () => {
  const base = { workId: 'OL1W', myActiveLoans: [], myActiveReservations: [] };

  it('allows reserving a book someone else holds', () => {
    expect(canReserve({ ...base, availability: onLoan })).toEqual({ allowed: true });
  });

  it('allows joining the queue of a book already reserved by others', () => {
    expect(canReserve({ ...base, availability: { onLoan: false, reservationsCount: 1 } })).toEqual({ allowed: true });
  });

  it('rejects an available book', () => {
    expect(canReserve({ ...base, availability: available })).toEqual({
      allowed: false,
      reason: 'Este libro está disponible: puedes pedirlo prestado.',
    });
  });

  it('rejects a book the user holds', () => {
    expect(canReserve({ ...base, availability: onLoan, myActiveLoans: [{ workId: 'OL1W' }] })).toEqual({
      allowed: false,
      reason: 'Ya tienes este libro en préstamo.',
    });
  });

  it('rejects a book the user already reserved', () => {
    expect(canReserve({ ...base, availability: onLoan, myActiveReservations: [{ workId: 'OL1W' }] })).toEqual({
      allowed: false,
      reason: 'Ya reservaste este libro.',
    });
  });

  it('rejects when availability is unknown', () => {
    expect(canReserve({ ...base, availability: undefined })).toEqual({
      allowed: false,
      reason: 'No pudimos comprobar la disponibilidad.',
    });
  });
});
