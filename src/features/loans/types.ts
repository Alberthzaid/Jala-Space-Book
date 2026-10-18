import type { Book } from '@/shared/types/book';

export type LoanBook = Pick<Book, 'id' | 'title' | 'authors' | 'coverId'>;

export interface Loan {
  id: string;
  workId: string;
  title: string;
  authors: string[];
  coverId?: number;
  borrowedAt: string;
  dueAt: string;
  renewed: boolean;
  returnedAt: string | null;
}

export interface Reservation {
  id: string;
  workId: string;
  title: string;
  authors: string[];
  coverId?: number;
  createdAt: string;
  notifiedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
}

export interface Availability {
  workId: string;
  onLoan: boolean;
  dueAt: string | null;
  reservationsCount: number;
}

export type AvailabilityMap = Readonly<Record<string, Availability>>;
