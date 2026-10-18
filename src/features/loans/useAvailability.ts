import { useRef } from 'react';

import { supabase } from '@/shared/api/supabase';
import { useAsync, type AsyncStatus } from '@/shared/hooks/useAsync';
import { fetchAvailability, uniqueWorkIds } from './api/availability';
import type { AvailabilityMap } from './types';
import { useLoans } from './useLoans';

export interface AvailabilityResult {
  availability: AvailabilityMap;
  status: AsyncStatus;
  retry: () => void;
}

const EMPTY: AvailabilityMap = {};

export function useAvailability(workIds: readonly string[]): AvailabilityResult {
  const { version } = useLoans();
  const key = uniqueWorkIds(workIds).join(',');
  const client = supabase;
  const result = useAsync(
    client && key ? () => fetchAvailability(client, key.split(',')) : null,
    [key, version]
  );

  const lastRef = useRef<{ key: string; map: AvailabilityMap }>({ key: '', map: EMPTY });
  if (result.status === 'success' && result.data) lastRef.current = { key, map: result.data };
  const availability = lastRef.current.key === key ? lastRef.current.map : EMPTY;

  return { availability, status: result.status, retry: result.retry };
}
