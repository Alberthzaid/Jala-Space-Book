import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchAvailability, formatFullDate, formatShortDate, getAvailabilityStatus, mapAvailabilityRows } from './availability';

function rpcClient(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe('mapAvailabilityRows', () => {
  it('maps RPC rows by work id', () => {
    expect(
      mapAvailabilityRows([
        { work_id: 'OL1W', on_loan: true, due_at: '2026-10-20T12:00:00+00:00', reservations_count: 2 },
        { work_id: 'OL2W', on_loan: false, due_at: null, reservations_count: 0 },
      ])
    ).toEqual({
      OL1W: { workId: 'OL1W', onLoan: true, dueAt: '2026-10-20T12:00:00+00:00', reservationsCount: 2 },
      OL2W: { workId: 'OL2W', onLoan: false, dueAt: null, reservationsCount: 0 },
    });
  });

  it('returns an empty map for non-array data', () => {
    expect(mapAvailabilityRows(null)).toEqual({});
    expect(mapAvailabilityRows({})).toEqual({});
  });

  it('skips malformed rows', () => {
    expect(mapAvailabilityRows([{ work_id: 5 }, { on_loan: true }, 'x', null])).toEqual({});
  });

  it('coerces the reservation count and never returns negatives', () => {
    const map = mapAvailabilityRows([
      { work_id: 'OL1W', on_loan: false, due_at: null, reservations_count: '3' },
      { work_id: 'OL2W', on_loan: false, due_at: null, reservations_count: -1 },
      { work_id: 'OL3W', on_loan: false, due_at: null, reservations_count: 'abc' },
    ]);
    expect(map.OL1W?.reservationsCount).toBe(3);
    expect(map.OL2W?.reservationsCount).toBe(0);
    expect(map.OL3W?.reservationsCount).toBe(0);
  });
});

describe('fetchAvailability', () => {
  it('calls the RPC once with unique, valid work ids', async () => {
    const { client, rpc } = rpcClient({
      data: [{ work_id: 'OL1W', on_loan: true, due_at: '2026-10-20T12:00:00Z', reservations_count: 0 }],
      error: null,
    });
    const map = await fetchAvailability(client, ['OL1W', 'OL1W', 'bad-id', 'OL2W']);
    expect(rpc).toHaveBeenCalledWith('get_availability', { work_ids: ['OL1W', 'OL2W'] });
    expect(map.OL1W?.onLoan).toBe(true);
    expect(map.OL2W).toEqual({ workId: 'OL2W', onLoan: false, dueAt: null, reservationsCount: 0 });
  });

  it('skips the request when there are no valid ids', async () => {
    const { client, rpc } = rpcClient({ data: [], error: null });
    expect(await fetchAvailability(client, ['nope'])).toEqual({});
    expect(rpc).not.toHaveBeenCalled();
  });

  it('throws when the RPC fails', async () => {
    const { client } = rpcClient({ data: null, error: { message: 'boom', code: '500' } });
    await expect(fetchAvailability(client, ['OL1W'])).rejects.toThrow('boom');
  });
});

describe('getAvailabilityStatus', () => {
  it('describes an available book', () => {
    expect(getAvailabilityStatus({ workId: 'OL1W', onLoan: false, dueAt: null, reservationsCount: 0 })).toEqual({
      kind: 'available',
      label: 'Disponible',
    });
  });

  it('describes a book on loan with its due date', () => {
    expect(
      getAvailabilityStatus({ workId: 'OL1W', onLoan: true, dueAt: '2026-10-20T12:00:00Z', reservationsCount: 1 })
    ).toEqual({ kind: 'on_loan', label: 'Prestado hasta 20/10' });
  });

  it('describes a returned book waiting for its reservations', () => {
    expect(getAvailabilityStatus({ workId: 'OL1W', onLoan: false, dueAt: null, reservationsCount: 1 })).toEqual({
      kind: 'reserved',
      label: 'Reservado',
    });
  });
});

describe('formatShortDate / formatFullDate', () => {
  it('formats as dd/mm', () => {
    expect(formatShortDate('2026-03-05T12:00:00Z')).toBe('05/03');
  });

  it('formats as dd/mm/yyyy', () => {
    expect(formatFullDate('2026-03-05T12:00:00Z')).toBe('05/03/2026');
  });
});
