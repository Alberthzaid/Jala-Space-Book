import type { AvailabilityMap } from '@/features/loans';

export interface WatchedReservation {
  id: string;
  workId: string;
  title: string;
  notifiedAt: string | null;
}

export interface WatchedWish {
  workId: string;
  title: string;
}

export type AvailabilityNotice =
  | { key: string; kind: 'reservation'; workId: string; title: string; reservationId: string }
  | { key: string; kind: 'want'; workId: string; title: string };

export interface NoticeInput {
  reservations: readonly WatchedReservation[];
  wantItems: readonly WatchedWish[];
  availability: AvailabilityMap;
  previouslyOnLoan: ReadonlySet<string>;
  heldWorkIds: ReadonlySet<string>;
  alreadyNotified: ReadonlySet<string>;
}

export interface NoticeResult {
  notices: AvailabilityNotice[];
  watchedOnLoan: string[];
}

export function computeAvailabilityNotices(input: NoticeInput): NoticeResult {
  const { reservations, wantItems, availability, previouslyOnLoan, heldWorkIds, alreadyNotified } = input;
  const notices: AvailabilityNotice[] = [];
  const noticedWorks = new Set<string>();

  for (const reservation of reservations) {
    const key = `reservation:${reservation.id}`;
    const info = availability[reservation.workId];
    if (reservation.notifiedAt || alreadyNotified.has(key) || !info || info.onLoan) continue;
    notices.push({ key, kind: 'reservation', workId: reservation.workId, title: reservation.title, reservationId: reservation.id });
    noticedWorks.add(reservation.workId);
  }

  const watchedOnLoan: string[] = [];
  for (const wish of wantItems) {
    if (heldWorkIds.has(wish.workId)) continue;
    const info = availability[wish.workId];
    const wasOnLoan = previouslyOnLoan.has(wish.workId);
    if (!info) {
      if (wasOnLoan) watchedOnLoan.push(wish.workId);
      continue;
    }
    if (info.onLoan) {
      watchedOnLoan.push(wish.workId);
      continue;
    }
    const key = `want:${wish.workId}`;
    if (wasOnLoan && !alreadyNotified.has(key) && !noticedWorks.has(wish.workId)) {
      notices.push({ key, kind: 'want', workId: wish.workId, title: wish.title });
      noticedWorks.add(wish.workId);
    }
  }

  return { notices, watchedOnLoan };
}
