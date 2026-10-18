import { TrendingUp } from 'lucide-react';

import { getTrendingBooks } from '@/shared/api/openLibrary';
import { useAsync } from '@/shared/hooks/useAsync';
import BookCarousel from './BookCarousel';

export default function TrendingSection() {
  const trending = useAsync((signal) => getTrendingBooks(signal), []);

  return (
    <BookCarousel
      id="trending"
      title="Tendencias de hoy"
      description="Lo más consultado hoy en Open Library"
      icon={<TrendingUp className="text-amber-600 size-[22px] shrink-0" aria-hidden="true" />}
      result={trending}
    />
  );
}
