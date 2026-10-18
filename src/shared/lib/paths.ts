export const HOME_PATH = '/';
export const CATALOG_PATH = '/catalogo';
export const BOOK_DETAIL_ROUTE = '/libro/:id';
export const READING_LIST_PATH = '/mi-lista';
export const LOANS_PATH = '/prestamos';
export const LOGIN_PATH = '/login';
export const REGISTER_PATH = '/registro';

export const OPEN_LIBRARY_WORK_URL = 'https://openlibrary.org/works';

export function getBookDetailPath(workId: string): string {
  return `/libro/${encodeURIComponent(workId)}`;
}

function getCatalogPathWith(param: 'q' | 'subject', value: string): string {
  const trimmed = value.trim();
  return trimmed ? `${CATALOG_PATH}?${new URLSearchParams({ [param]: trimmed }).toString()}` : CATALOG_PATH;
}

export function getCatalogSearchPath(term: string): string {
  return getCatalogPathWith('q', term);
}

export function getCatalogSubjectPath(subject: string): string {
  return getCatalogPathWith('subject', subject);
}
