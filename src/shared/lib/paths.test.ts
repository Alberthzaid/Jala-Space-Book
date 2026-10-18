import { describe, expect, it } from 'vitest';

import {
  READING_LIST_PATH,
  getBookDetailPath,
  getCatalogSearchPath,
  getCatalogSubjectPath,
} from './paths';

describe('getBookDetailPath', () => {
  it('builds the detail path from the Open Library work id', () => {
    expect(getBookDetailPath('OL27482W')).toBe('/libro/OL27482W');
  });

  it('encodes unexpected characters', () => {
    expect(getBookDetailPath('a/b')).toBe('/libro/a%2Fb');
  });
});

describe('getCatalogSearchPath', () => {
  it('returns the plain catalog path for an empty or blank term', () => {
    expect(getCatalogSearchPath('')).toBe('/catalogo');
    expect(getCatalogSearchPath('   ')).toBe('/catalogo');
  });

  it('encodes the trimmed term as the q parameter', () => {
    expect(getCatalogSearchPath('  Clean Code & más ')).toBe('/catalogo?q=Clean+Code+%26+m%C3%A1s');
  });
});

describe('getCatalogSubjectPath', () => {
  it('encodes the subject as the subject parameter', () => {
    expect(getCatalogSubjectPath('science_fiction')).toBe('/catalogo?subject=science_fiction');
    expect(getCatalogSubjectPath('Science fiction')).toBe('/catalogo?subject=Science+fiction');
  });

  it('returns the plain catalog path for a blank subject', () => {
    expect(getCatalogSubjectPath('  ')).toBe('/catalogo');
  });
});

describe('READING_LIST_PATH', () => {
  it('points to the reading list screen', () => {
    expect(READING_LIST_PATH).toBe('/mi-lista');
  });
});
