import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  OpenLibraryError,
  buildSearchUrl,
  getCoverUrl,
  getSubjectBooks,
  getTrendingBooks,
  getWork,
  isValidWorkId,
  normalizeDescription,
  parseYear,
  searchBooks,
  toBook,
  workIdFromKey,
} from './openLibrary';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('workIdFromKey', () => {
  it('extracts the OLID from a works key', () => {
    expect(workIdFromKey('/works/OL27482W')).toBe('OL27482W');
  });

  it('extracts the OLID from an authors key', () => {
    expect(workIdFromKey('/authors/OL26320A')).toBe('OL26320A');
  });

  it('returns a bare id unchanged', () => {
    expect(workIdFromKey('OL1W')).toBe('OL1W');
  });
});

describe('isValidWorkId', () => {
  it('accepts work OLIDs', () => {
    expect(isValidWorkId('OL27482W')).toBe(true);
  });

  it('rejects other ids', () => {
    expect(isValidWorkId('OLxxxW')).toBe(false);
    expect(isValidWorkId('OL26320A')).toBe(false);
    expect(isValidWorkId('4')).toBe(false);
    expect(isValidWorkId(undefined)).toBe(false);
  });
});

describe('getCoverUrl', () => {
  it('builds the cover URL with the medium size by default', () => {
    expect(getCoverUrl(14627509)).toBe('https://covers.openlibrary.org/b/id/14627509-M.jpg');
  });

  it('uses the requested size', () => {
    expect(getCoverUrl(1, 'L')).toBe('https://covers.openlibrary.org/b/id/1-L.jpg');
    expect(getCoverUrl(1, 'S')).toBe('https://covers.openlibrary.org/b/id/1-S.jpg');
  });
});

describe('normalizeDescription', () => {
  it('returns a plain string description trimmed', () => {
    expect(normalizeDescription('  A tale.  ')).toBe('A tale.');
  });

  it('reads the value of an object description', () => {
    expect(normalizeDescription({ type: '/type/text', value: 'Typed text' })).toBe('Typed text');
  });

  it('normalizes Windows line breaks', () => {
    expect(normalizeDescription('One.\r\n\r\nTwo.')).toBe('One.\n\nTwo.');
  });

  it('returns undefined for missing or empty descriptions', () => {
    expect(normalizeDescription(undefined)).toBeUndefined();
    expect(normalizeDescription('   ')).toBeUndefined();
    expect(normalizeDescription({ value: 42 })).toBeUndefined();
    expect(normalizeDescription(null)).toBeUndefined();
  });
});

describe('parseYear', () => {
  it('finds a four-digit year inside a date string', () => {
    expect(parseYear('September 21, 1937')).toBe(1937);
    expect(parseYear('1954')).toBe(1954);
  });

  it('returns undefined when there is no year', () => {
    expect(parseYear(undefined)).toBeUndefined();
    expect(parseYear('unknown')).toBeUndefined();
  });
});

describe('toBook', () => {
  it('maps a search document', () => {
    expect(
      toBook({
        key: '/works/OL27482W',
        title: 'The Hobbit',
        author_name: ['J.R.R. Tolkien'],
        first_publish_year: 1937,
        cover_i: 14627509,
        edition_count: 482,
        subject: ['Fantasy', 'Dragons'],
      })
    ).toEqual({
      id: 'OL27482W',
      title: 'The Hobbit',
      authors: ['J.R.R. Tolkien'],
      year: 1937,
      coverId: 14627509,
      editionCount: 482,
      subjects: ['Fantasy', 'Dragons'],
    });
  });

  it('maps a subject work that uses authors objects and cover_id', () => {
    expect(
      toBook({
        key: '/works/OL1W',
        title: 'I, Robot',
        authors: [{ key: '/authors/OL1A', name: 'Isaac Asimov' }],
        cover_id: 99,
        first_publish_year: 1950,
        edition_count: 10,
      })
    ).toEqual({
      id: 'OL1W',
      title: 'I, Robot',
      authors: ['Isaac Asimov'],
      year: 1950,
      coverId: 99,
      editionCount: 10,
    });
  });

  it('leaves missing optional fields undefined and falls back to an untitled label', () => {
    expect(toBook({ key: '/works/OL2W' })).toEqual({
      id: 'OL2W',
      title: 'Sin título',
      authors: [],
    });
  });

  it('ignores non-positive cover ids', () => {
    expect(toBook({ key: '/works/OL3W', title: 'X', cover_i: -1 }).coverId).toBeUndefined();
  });
});

describe('buildSearchUrl', () => {
  it('builds a query search with the default page, limit and fields', () => {
    const url = new URL(buildSearchUrl({ q: 'tolkien' }));
    expect(url.origin + url.pathname).toBe('https://openlibrary.org/search.json');
    expect(url.searchParams.get('q')).toBe('tolkien');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('limit')).toBe('20');
    expect(url.searchParams.get('fields')).toBe(
      'key,title,author_name,first_publish_year,cover_i,edition_count,subject'
    );
    expect(url.searchParams.has('subject')).toBe(false);
    expect(url.searchParams.has('sort')).toBe(false);
  });

  it('includes subject, sort and page when given', () => {
    const url = new URL(buildSearchUrl({ q: '', subject: 'science_fiction', sort: 'new', page: 3 }));
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.get('subject')).toBe('science_fiction');
    expect(url.searchParams.get('sort')).toBe('new');
    expect(url.searchParams.get('page')).toBe('3');
  });

  it('trims the query and honours a custom limit', () => {
    const url = new URL(buildSearchUrl({ q: '  clean code ', limit: 9 }));
    expect(url.searchParams.get('q')).toBe('clean code');
    expect(url.searchParams.get('limit')).toBe('9');
  });

  it('omits the relevance sort because it is the API default', () => {
    const url = new URL(buildSearchUrl({ q: 'a', sort: 'relevance' }));
    expect(url.searchParams.has('sort')).toBe(false);
  });

  it('sends the oldest-first and title sorts', () => {
    expect(new URL(buildSearchUrl({ q: 'a', sort: 'old' })).searchParams.get('sort')).toBe('old');
    expect(new URL(buildSearchUrl({ q: 'a', sort: 'title' })).searchParams.get('sort')).toBe('title');
  });
});

describe('searchBooks', () => {
  it('requests the search URL and maps the response', async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        numFound: 2071,
        docs: [{ key: '/works/OL27482W', title: 'The Hobbit', author_name: ['J.R.R. Tolkien'] }],
      })
    );
    const controller = new AbortController();

    const result = await searchBooks({ q: 'tolkien', page: 2 }, controller.signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requested, init] = fetchMock.mock.calls[0] ?? [];
    expect(new URL(String(requested)).searchParams.get('page')).toBe('2');
    expect(init?.signal).toBe(controller.signal);
    expect(result.numFound).toBe(2071);
    expect(result.books).toEqual([
      { id: 'OL27482W', title: 'The Hobbit', authors: ['J.R.R. Tolkien'] },
    ]);
  });

  it('throws an OpenLibraryError with the status on a non-OK response', async () => {
    stubFetch(jsonResponse({ error: 'boom' }, 500));

    await expect(searchBooks({ q: 'x' })).rejects.toMatchObject({
      name: 'OpenLibraryError',
      status: 500,
    });
  });

  it('tolerates a response without docs', async () => {
    stubFetch(jsonResponse({}));

    await expect(searchBooks({ q: 'x' })).resolves.toEqual({ books: [], numFound: 0 });
  });
});

describe('getTrendingBooks', () => {
  it('requests the daily trending list and maps works', async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        works: [{ key: '/works/OL17930368W', title: 'Atomic Habits', author_name: ['James Clear'], cover_i: 12539702 }],
      })
    );

    const books = await getTrendingBooks();

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://openlibrary.org/trending/daily.json?limit=12');
    expect(books).toEqual([
      { id: 'OL17930368W', title: 'Atomic Habits', authors: ['James Clear'], coverId: 12539702 },
    ]);
  });
});

describe('getSubjectBooks', () => {
  it('requests the subject endpoint with an encoded slug', async () => {
    const fetchMock = stubFetch(jsonResponse({ works: [{ key: '/works/OL1W', title: 'Dune', authors: [{ name: 'Frank Herbert' }] }] }));

    const books = await getSubjectBooks('science_fiction');

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://openlibrary.org/subjects/science_fiction.json?limit=12');
    expect(books).toEqual([{ id: 'OL1W', title: 'Dune', authors: ['Frank Herbert'] }]);
  });
});

describe('getWork', () => {
  it('loads the work and resolves its authors', async () => {
    const fetchMock = stubFetch(
      jsonResponse({
        key: '/works/OL27482W',
        title: 'The Hobbit',
        description: { value: 'A tale.' },
        authors: [{ author: { key: '/authors/OL26320A' } }],
        subjects: ['Fantasy', 'Dragons'],
        covers: [-1, 14627509],
        first_publish_date: 'September 21, 1937',
      }),
      jsonResponse({ name: 'J. R. R. Tolkien' })
    );

    const detail = await getWork('OL27482W');

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://openlibrary.org/works/OL27482W.json');
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe('https://openlibrary.org/authors/OL26320A.json');
    expect(detail).toEqual({
      id: 'OL27482W',
      title: 'The Hobbit',
      description: 'A tale.',
      authors: [{ id: 'OL26320A', name: 'J. R. R. Tolkien' }],
      subjects: ['Fantasy', 'Dragons'],
      coverId: 14627509,
      year: 1937,
    });
  });

  it('skips authors whose lookup fails instead of failing the whole work', async () => {
    stubFetch(
      jsonResponse({ key: '/works/OL1W', title: 'T', authors: [{ author: { key: '/authors/OL9A' } }] }),
      jsonResponse({}, 500)
    );

    const detail = await getWork('OL1W');

    expect(detail.authors).toEqual([]);
  });

  it('follows a redirect record once', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ key: '/works/OL1W', type: { key: '/type/redirect' }, location: '/works/OL2W' }),
      jsonResponse({ key: '/works/OL2W', title: 'Merged' })
    );

    const detail = await getWork('OL1W');

    expect(String(fetchMock.mock.calls[1]?.[0])).toBe('https://openlibrary.org/works/OL2W.json');
    expect(detail.id).toBe('OL2W');
    expect(detail.title).toBe('Merged');
  });

  it('marks a 404 as not found', async () => {
    stubFetch(jsonResponse({ error: 'notfound' }, 404));

    const error = await getWork('OL999W').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OpenLibraryError);
    expect((error as OpenLibraryError).isNotFound).toBe(true);
  });
});
