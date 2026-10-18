export interface Subject {
  label: string;
  slug: string;
}

export const SUBJECTS: readonly Subject[] = [
  { label: 'Ficción', slug: 'fiction' },
  { label: 'Ciencia ficción', slug: 'science_fiction' },
  { label: 'Fantasía', slug: 'fantasy' },
  { label: 'Misterio', slug: 'mystery' },
  { label: 'Historia', slug: 'history' },
  { label: 'Ciencia', slug: 'science' },
  { label: 'Programación', slug: 'programming' },
  { label: 'Filosofía', slug: 'philosophy' },
  { label: 'Negocios', slug: 'business' },
  { label: 'Arte', slug: 'art' },
  { label: 'Poesía', slug: 'poetry' },
  { label: 'Biografías', slug: 'biography' },
];

export function getSubjectLabel(subject: string): string {
  return SUBJECTS.find((candidate) => candidate.slug === subject)?.label ?? subject;
}
