import { env } from '@/shared/config/env';
import type { AuthorRef, Book, BookDetail, SearchResult } from '@/shared/types/book';

const API_BASE = env.openLibraryBaseUrl;
const COVERS_BASE = 'https://covers.openlibrary.org/b/id';

export const SEARCH_PAGE_SIZE = 20;
const SHELF_SIZE = 12;
const SEARCH_FIELDS = 'key,title,author_name,first_publish_year,cover_i,edition_count,subject';
const UNTITLED_LABEL = 'Sin título';
const WORK_ID_PATTERN = /^OL\d+W$/;

export type CoverSize = 'S' | 'M' | 'L';

export type SearchSort = 'relevance' | 'new' | 'old' | 'title' | 'rating';

export interface SearchParams {
  q?: string;
  subject?: string;
  sort?: SearchSort;
  page?: number;
  limit?: number;
}

export interface RawWork {
  key: string;
  title?: string;
  author_name?: string[];
  authors?: { key?: string; name?: string }[];
  first_publish_year?: number;
  cover_i?: number;
  cover_id?: number;
  edition_count?: number;
  subject?: string[];
}

interface RawWorkRecord {
  key: string;
  title?: string;
  description?: unknown;
  authors?: { author?: { key?: string } }[];
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
  type?: { key?: string };
  location?: string;
}

export class OpenLibraryError extends Error {
  readonly status: number;

  constructor(status: number, url: string) {
    super(`Open Library request failed with status ${status}: ${url}`);
    this.name = 'OpenLibraryError';
    this.status = status;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export function workIdFromKey(key: string): string {
  return key.split('/').filter(Boolean).pop() ?? '';
}

export function isValidWorkId(id: string | undefined): id is string {
  return typeof id === 'string' && WORK_ID_PATTERN.test(id);
}

export function getCoverUrl(coverId: number, size: CoverSize = 'M'): string {
  return `${COVERS_BASE}/${coverId}-${size}.jpg`;
}

export function normalizeDescription(raw: unknown): string | undefined {
  const text =
    typeof raw === 'string'
      ? raw
      : raw !== null && typeof raw === 'object' && 'value' in raw && typeof raw.value === 'string'
        ? raw.value
        : undefined;
  const normalized = text?.replace(/\r\n/g, '\n').trim();
  return normalized ? normalized : undefined;
}

export function parseYear(date: string | undefined): number | undefined {
  const match = date?.match(/\b(\d{4})\b/);
  return match?.[1] ? Number(match[1]) : undefined;
}

function validCoverId(id: number | undefined): number | undefined {
  return typeof id === 'number' && id > 0 ? id : undefined;
}

export function toBook(raw: RawWork): Book {
  const authors =
    raw.author_name ??
    (raw.authors ?? []).map((author) => author.name).filter((name): name is string => Boolean(name));
  const book: Book = {
    id: workIdFromKey(raw.key),
    title: raw.title?.trim() || UNTITLED_LABEL,
    authors,
  };
  if (typeof raw.first_publish_year === 'number') book.year = raw.first_publish_year;
  const coverId = validCoverId(raw.cover_i ?? raw.cover_id);
  if (coverId !== undefined) book.coverId = coverId;
  if (typeof raw.edition_count === 'number') book.editionCount = raw.edition_count;
  if (raw.subject?.length) book.subjects = raw.subject;
  return book;
}

export function buildSearchUrl({ q, subject, sort, page = 1, limit = SEARCH_PAGE_SIZE }: SearchParams): string {
  const params = new URLSearchParams();
  const query = q?.trim();
  if (query) params.set('q', query);
  const subjectFilter = subject?.trim();
  if (subjectFilter) params.set('subject', subjectFilter);
  if (sort && sort !== 'relevance') params.set('sort', sort);
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('fields', SEARCH_FIELDS);
  return `${API_BASE}/search.json?${params.toString()}`;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new OpenLibraryError(response.status, url);
  return (await response.json()) as T;
}

export async function searchBooks(params: SearchParams, signal?: AbortSignal): Promise<SearchResult> {
  const data = await fetchJson<{ numFound?: number; docs?: RawWork[] }>(buildSearchUrl(params), signal);
  return {
    books: (data.docs ?? []).map(toBook),
    numFound: data.numFound ?? 0,
  };
}

export async function getTrendingBooks(signal?: AbortSignal): Promise<Book[]> {
  const data = await fetchJson<{ works?: RawWork[] }>(`${API_BASE}/trending/daily.json?limit=${SHELF_SIZE}`, signal);
  return (data.works ?? []).map(toBook);
}

export async function getSubjectBooks(slug: string, signal?: AbortSignal): Promise<Book[]> {
  const url = `${API_BASE}/subjects/${encodeURIComponent(slug)}.json?limit=${SHELF_SIZE}`;
  const data = await fetchJson<{ works?: RawWork[] }>(url, signal);
  return (data.works ?? []).map(toBook);
}

async function getAuthor(authorId: string, signal?: AbortSignal): Promise<AuthorRef | undefined> {
  const data = await fetchJson<{ name?: string; personal_name?: string }>(
    `${API_BASE}/authors/${encodeURIComponent(authorId)}.json`,
    signal
  );
  const name = data.name ?? data.personal_name;
  return name ? { id: authorId, name } : undefined;
}

async function getWorkRecord(workId: string, signal?: AbortSignal): Promise<RawWorkRecord> {
  const url = (id: string) => `${API_BASE}/works/${encodeURIComponent(id)}.json`;
  const record = await fetchJson<RawWorkRecord>(url(workId), signal);
  if (record.type?.key === '/type/redirect' && record.location) {
    return fetchJson<RawWorkRecord>(url(workIdFromKey(record.location)), signal);
  }
  return record;
}

export async function getWork(workId: string, signal?: AbortSignal): Promise<BookDetail> {
  const record = await getWorkRecord(workId, signal);
  const authorIds = (record.authors ?? [])
    .map((entry) => entry.author?.key)
    .filter((key): key is string => Boolean(key))
    .map(workIdFromKey);

  const settled = await Promise.allSettled(authorIds.map((id) => getAuthor(id, signal)));
  if (signal?.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
  const authors = settled.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));

  const detail: BookDetail = {
    id: workIdFromKey(record.key),
    title: record.title?.trim() || UNTITLED_LABEL,
    authors,
    subjects: record.subjects ?? [],
  };
  const description = normalizeDescription(record.description);
  if (description) detail.description = description;
  const coverId = (record.covers ?? []).find((id) => id > 0);
  if (coverId !== undefined) detail.coverId = coverId;
  const year = parseYear(record.first_publish_date);
  if (year !== undefined) detail.year = year;
  return detail;
}
