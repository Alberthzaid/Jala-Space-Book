import { useState } from 'react';
import { BookOpen } from 'lucide-react';

import { getCoverUrl, type CoverSize } from '@/shared/api/openLibrary';
import { cn } from '@/shared/lib/utils';

const COVER_DIMENSIONS: Record<CoverSize, { width: number; height: number }> = {
  S: { width: 60, height: 90 },
  M: { width: 180, height: 270 },
  L: { width: 400, height: 600 },
};

interface BookCoverProps {
  title: string;
  coverId?: number;
  size?: CoverSize;
  className?: string;
  imageClassName?: string;
}

export default function BookCover({ title, coverId, size = 'M', className, imageClassName }: BookCoverProps) {
  const [failedId, setFailedId] = useState<number | undefined>(undefined);
  const showImage = coverId !== undefined && failedId !== coverId;

  return (
    <div className={cn('relative w-full h-full overflow-hidden bg-surface-container-high', className)}>
      {showImage ? (
        <img
          className={cn('w-full h-full object-cover', imageClassName)}
          alt={`Portada de ${title}`}
          src={getCoverUrl(coverId, size)}
          width={COVER_DIMENSIONS[size].width}
          height={COVER_DIMENSIONS[size].height}
          loading="lazy"
          decoding="async"
          onError={() => setFailedId(coverId)}
        />
      ) : (
        <div
          role="img"
          aria-label={`${title} (sin portada disponible)`}
          className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center text-on-surface-variant"
        >
          <BookOpen className="size-7 text-outline" aria-hidden="true" />
          <span className="text-[11px] font-semibold leading-tight line-clamp-3" aria-hidden="true">{title}</span>
        </div>
      )}
    </div>
  );
}
