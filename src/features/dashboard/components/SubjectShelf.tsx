import { getSubjectBooks } from '@/shared/api/openLibrary';
import { useAsync } from '@/shared/hooks/useAsync';
import { getCatalogSubjectPath } from '@/shared/lib/paths';
import { getSubjectLabel } from '@/shared/lib/subjects';
import BookCarousel from './BookCarousel';

interface SubjectShelfProps {
  slug: string;
}

export default function SubjectShelf({ slug }: SubjectShelfProps) {
  const books = useAsync((signal) => getSubjectBooks(slug, signal), [slug]);

  return (
    <BookCarousel
      id={`shelf-${slug}`}
      title={getSubjectLabel(slug)}
      seeAllHref={getCatalogSubjectPath(slug)}
      result={books}
    />
  );
}
