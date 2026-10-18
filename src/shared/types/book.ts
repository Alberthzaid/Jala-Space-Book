export interface Book {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  coverId?: number;
  editionCount?: number;
  subjects?: string[];
}

export interface AuthorRef {
  id: string;
  name: string;
}

export interface BookDetail {
  id: string;
  title: string;
  authors: AuthorRef[];
  description?: string;
  subjects: string[];
  coverId?: number;
  year?: number;
}

export interface SearchResult {
  books: Book[];
  numFound: number;
}
