import type { SupabaseClient } from '@supabase/supabase-js';

import { isValidWorkId } from '@/shared/api/openLibrary';
import type { Availability, AvailabilityMap } from '../types';

const MAX_IDS_PER_REQUEST = 100;

export type AvailabilityKind = 'available' | 'on_loan' | 'reserved';

export interface AvailabilityStatus {
  kind: AvailabilityKind;
  label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function toCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export function mapAvailabilityRows(data: unknown): Record<string, Availability> {
  if (!Array.isArray(data)) return {};
  const map: Record<string, Availability> = {};
  for (const row of data) {
    if (!isRecord(row) || typeof row.work_id !== 'string' || typeof row.on_loan !== 'boolean') continue;
    map[row.work_id] = {
      workId: row.work_id,
      onLoan: row.on_loan,
      dueAt: typeof row.due_at === 'string' ? row.due_at : null,
      reservationsCount: toCount(row.reservations_count),
    };
  }
  return map;
}

export function unknownToAvailable(workId: string): Availability {
  return { workId, onLoan: false, dueAt: null, reservationsCount: 0 };
}

export function uniqueWorkIds(workIds: readonly string[]): string[] {
  return [...new Set(workIds.filter((id) => isValidWorkId(id)))].slice(0, MAX_IDS_PER_REQUEST);
}

export async function fetchAvailability(client: SupabaseClient, workIds: readonly string[]): Promise<AvailabilityMap> {
  const ids = uniqueWorkIds(workIds);
  if (ids.length === 0) return {};
  const { data, error } = await client.rpc('get_availability', { work_ids: ids });
  if (error) throw new Error(error.message);
  const rows = mapAvailabilityRows(data);
  return Object.fromEntries(ids.map((id) => [id, rows[id] ?? unknownToAvailable(id)]));
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

export function formatFullDate(isoDate: string): string {
  return `${formatShortDate(isoDate)}/${new Date(isoDate).getFullYear()}`;
}

export function getAvailabilityStatus(availability: Availability): AvailabilityStatus {
  if (availability.onLoan) {
    return {
      kind: 'on_loan',
      label: availability.dueAt ? `Prestado hasta ${formatShortDate(availability.dueAt)}` : 'Prestado',
    };
  }
  if (availability.reservationsCount > 0) return { kind: 'reserved', label: 'Reservado' };
  return { kind: 'available', label: 'Disponible' };
}
