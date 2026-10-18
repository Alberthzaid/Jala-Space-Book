import { describe, expect, it } from 'vitest';

import { computeAvailabilityNotices, type NoticeInput } from './availabilityNotices';

const free = (workId: string) => ({ workId, onLoan: false, dueAt: null, reservationsCount: 0 });
const taken = (workId: string) => ({ workId, onLoan: true, dueAt: '2026-10-20T12:00:00Z', reservationsCount: 1 });

function input(overrides: Partial<NoticeInput> = {}): NoticeInput {
  return {
    reservations: [],
    wantItems: [],
    availability: {},
    previouslyOnLoan: new Set(),
    heldWorkIds: new Set(),
    alreadyNotified: new Set(),
    ...overrides,
  };
}

const reservation = { id: 'r1', workId: 'OL1W', title: 'Dune', notifiedAt: null };

describe('computeAvailabilityNotices', () => {
  it('notifies an active reservation whose book became available', () => {
    const result = computeAvailabilityNotices(input({ reservations: [reservation], availability: { OL1W: free('OL1W') } }));
    expect(result.notices).toEqual([
      { key: 'reservation:r1', kind: 'reservation', workId: 'OL1W', title: 'Dune', reservationId: 'r1' },
    ]);
  });

  it('does not notify a reservation while the book is still on loan', () => {
    const result = computeAvailabilityNotices(input({ reservations: [reservation], availability: { OL1W: taken('OL1W') } }));
    expect(result.notices).toEqual([]);
  });

  it('skips reservations that were already notified', () => {
    const persisted = computeAvailabilityNotices(
      input({ reservations: [{ ...reservation, notifiedAt: '2026-10-17T12:00:00Z' }], availability: { OL1W: free('OL1W') } })
    );
    expect(persisted.notices).toEqual([]);
    const inSession = computeAvailabilityNotices(
      input({ reservations: [reservation], availability: { OL1W: free('OL1W') }, alreadyNotified: new Set(['reservation:r1']) })
    );
    expect(inSession.notices).toEqual([]);
  });

  it('notifies a wishlist book only when it goes from on loan to available', () => {
    const wantItems = [{ workId: 'OL2W', title: 'Emma' }];
    const firstSeen = computeAvailabilityNotices(input({ wantItems, availability: { OL2W: free('OL2W') } }));
    expect(firstSeen.notices).toEqual([]);

    const returned = computeAvailabilityNotices(
      input({ wantItems, availability: { OL2W: free('OL2W') }, previouslyOnLoan: new Set(['OL2W']) })
    );
    expect(returned.notices).toEqual([{ key: 'want:OL2W', kind: 'want', workId: 'OL2W', title: 'Emma' }]);
    expect(returned.watchedOnLoan).toEqual([]);
  });

  it('remembers wishlist books that are on loan for the next check', () => {
    const result = computeAvailabilityNotices(
      input({ wantItems: [{ workId: 'OL2W', title: 'Emma' }], availability: { OL2W: taken('OL2W') } })
    );
    expect(result.notices).toEqual([]);
    expect(result.watchedOnLoan).toEqual(['OL2W']);
  });

  it('ignores wishlist books the user holds', () => {
    const result = computeAvailabilityNotices(
      input({
        wantItems: [{ workId: 'OL2W', title: 'Emma' }],
        availability: { OL2W: taken('OL2W') },
        heldWorkIds: new Set(['OL2W']),
      })
    );
    expect(result.watchedOnLoan).toEqual([]);
  });

  it('keeps the previous state when availability is missing', () => {
    const result = computeAvailabilityNotices(
      input({ wantItems: [{ workId: 'OL2W', title: 'Emma' }], previouslyOnLoan: new Set(['OL2W']) })
    );
    expect(result.notices).toEqual([]);
    expect(result.watchedOnLoan).toEqual(['OL2W']);
  });

  it('shows a single notice when a reserved book is also on the wishlist', () => {
    const result = computeAvailabilityNotices(
      input({
        reservations: [reservation],
        wantItems: [{ workId: 'OL1W', title: 'Dune' }],
        availability: { OL1W: free('OL1W') },
        previouslyOnLoan: new Set(['OL1W']),
      })
    );
    expect(result.notices.map((notice) => notice.key)).toEqual(['reservation:r1']);
  });
});
