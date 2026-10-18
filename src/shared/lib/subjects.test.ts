import { describe, expect, it } from 'vitest';

import { SUBJECTS, getSubjectLabel } from './subjects';

describe('SUBJECTS', () => {
  it('uses unique lowercase Open Library slugs', () => {
    const slugs = SUBJECTS.map((subject) => subject.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((slug) => expect(slug).toMatch(/^[a-z_]+$/));
  });
});

describe('getSubjectLabel', () => {
  it('returns the Spanish label of a known slug', () => {
    expect(getSubjectLabel('science_fiction')).toBe('Ciencia ficción');
    expect(getSubjectLabel('history')).toBe('Historia');
  });

  it('returns unknown subjects unchanged', () => {
    expect(getSubjectLabel('Dragons')).toBe('Dragons');
  });
});
