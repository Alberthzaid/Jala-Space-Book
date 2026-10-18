import type { SearchSort } from '@/shared/api/openLibrary';

export type CatalogSort = SearchSort | 'author';

export interface CatalogQuery {
  q: string;
  subject: string;
  sort: CatalogSort;
  page: number;
}

export const MAX_QUERY_LENGTH = 200;

const DEFAULT_QUERY: CatalogQuery = { q: '', subject: '', sort: 'relevance', page: 1 };
const SORTS: readonly CatalogSort[] = ['relevance', 'new', 'old', 'title', 'rating', 'author'];

function parseSort(value: string | null): CatalogSort {
  return SORTS.find((sort) => sort === value) ?? DEFAULT_QUERY.sort;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : DEFAULT_QUERY.page;
}

export function sanitizeText(value: string | null | undefined): string {
  return (value ?? '').trim().slice(0, MAX_QUERY_LENGTH).trim();
}

export function isClientSideSort(sort: CatalogSort): sort is 'author' {
  return sort === 'author';
}

export function toApiSort(sort: CatalogSort): SearchSort {
  return isClientSideSort(sort) ? 'relevance' : sort;
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  return {
    q: sanitizeText(params.get('q')),
    subject: sanitizeText(params.get('subject')),
    sort: parseSort(params.get('sort')),
    page: parsePage(params.get('page')),
  };
}

export function withCatalogQuery(current: URLSearchParams, patch: Partial<CatalogQuery>): URLSearchParams {
  const restartsSearch = patch.q !== undefined || patch.subject !== undefined || patch.sort !== undefined;
  const next: CatalogQuery = {
    ...parseCatalogQuery(current),
    ...(restartsSearch ? { page: 1 } : {}),
    ...patch,
  };

  const params = new URLSearchParams();
  const q = sanitizeText(next.q);
  const subject = sanitizeText(next.subject);
  if (q) params.set('q', q);
  if (subject) params.set('subject', subject);
  if (next.sort !== DEFAULT_QUERY.sort) params.set('sort', next.sort);
  if (next.page > 1) params.set('page', String(next.page));
  return params;
}

export function hasSearchCriteria({ q, subject }: Pick<CatalogQuery, 'q' | 'subject'>): boolean {
  return Boolean(q || subject);
}

export function getTotalPages(numFound: number, pageSize: number): number {
  return Math.ceil(numFound / pageSize);
}
