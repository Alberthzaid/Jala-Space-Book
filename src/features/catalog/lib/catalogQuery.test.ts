import { describe, expect, it } from 'vitest';

import {
  MAX_QUERY_LENGTH,
  getTotalPages,
  hasSearchCriteria,
  isClientSideSort,
  parseCatalogQuery,
  toApiSort,
  withCatalogQuery,
} from './catalogQuery';

const params = (init: string) => new URLSearchParams(init);

describe('parseCatalogQuery', () => {
  it('returns defaults for empty params', () => {
    expect(parseCatalogQuery(params(''))).toEqual({ q: '', subject: '', sort: 'relevance', page: 1 });
  });

  it('reads every parameter', () => {
    expect(parseCatalogQuery(params('q=tolkien&subject=fantasy&sort=new&page=3'))).toEqual({
      q: 'tolkien',
      subject: 'fantasy',
      sort: 'new',
      page: 3,
    });
  });

  it('trims text parameters', () => {
    expect(parseCatalogQuery(params('q=%20dune%20&subject=%20history%20'))).toMatchObject({ q: 'dune', subject: 'history' });
  });

  it('falls back to defaults for invalid sort and page values', () => {
    expect(parseCatalogQuery(params('sort=popular&page=0'))).toMatchObject({ sort: 'relevance', page: 1 });
    expect(parseCatalogQuery(params('page=-2'))).toMatchObject({ page: 1 });
    expect(parseCatalogQuery(params('page=abc'))).toMatchObject({ page: 1 });
    expect(parseCatalogQuery(params('page=2.5'))).toMatchObject({ page: 1 });
  });
});

describe('withCatalogQuery', () => {
  it('sets the query and drops the page so the search restarts', () => {
    const next = withCatalogQuery(params('q=old&page=4'), { q: 'new' });
    expect(next.toString()).toBe('q=new');
  });

  it('resets the page when the subject or sort change', () => {
    expect(withCatalogQuery(params('q=a&page=4'), { subject: 'history' }).get('page')).toBeNull();
    expect(withCatalogQuery(params('q=a&page=4'), { sort: 'rating' }).get('page')).toBeNull();
  });

  it('keeps other parameters when only the page changes', () => {
    const next = withCatalogQuery(params('q=a&subject=history&sort=new'), { page: 2 });
    expect(parseCatalogQuery(next)).toEqual({ q: 'a', subject: 'history', sort: 'new', page: 2 });
  });

  it('omits default values', () => {
    const next = withCatalogQuery(params('q=a&subject=history&sort=new&page=2'), {
      q: '  ',
      subject: '',
      sort: 'relevance',
      page: 1,
    });
    expect(next.toString()).toBe('');
  });

  it('does not mutate the input params', () => {
    const input = params('q=a');
    withCatalogQuery(input, { q: 'b' });
    expect(input.toString()).toBe('q=a');
  });
});

describe('sort options', () => {
  it('accepts the API sorts and the client-side author sort', () => {
    expect(parseCatalogQuery(params('q=a&sort=old')).sort).toBe('old');
    expect(parseCatalogQuery(params('q=a&sort=title')).sort).toBe('title');
    expect(parseCatalogQuery(params('q=a&sort=author')).sort).toBe('author');
  });

  it('asks the API for relevance when sorting by author', () => {
    expect(toApiSort('author')).toBe('relevance');
    expect(toApiSort('old')).toBe('old');
    expect(toApiSort('title')).toBe('title');
  });

  it('flags the author sort as client-side', () => {
    expect(isClientSideSort('author')).toBe(true);
    expect(isClientSideSort('new')).toBe(false);
  });
});

describe('query sanitizing', () => {
  it('limits the length of text parameters', () => {
    const long = 'a'.repeat(MAX_QUERY_LENGTH + 50);
    expect(parseCatalogQuery(params(`q=${long}&subject=${long}`))).toMatchObject({
      q: 'a'.repeat(MAX_QUERY_LENGTH),
      subject: 'a'.repeat(MAX_QUERY_LENGTH),
    });
    expect(withCatalogQuery(params(''), { q: long }).get('q')).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe('hasSearchCriteria', () => {
  it('is true with a query or a subject', () => {
    expect(hasSearchCriteria({ q: 'a', subject: '' })).toBe(true);
    expect(hasSearchCriteria({ q: '', subject: 'history' })).toBe(true);
  });

  it('is false without query and subject', () => {
    expect(hasSearchCriteria({ q: '', subject: '' })).toBe(false);
  });
});

describe('getTotalPages', () => {
  it('rounds up partial pages', () => {
    expect(getTotalPages(41, 20)).toBe(3);
    expect(getTotalPages(40, 20)).toBe(2);
  });

  it('returns zero for no results', () => {
    expect(getTotalPages(0, 20)).toBe(0);
  });
});
