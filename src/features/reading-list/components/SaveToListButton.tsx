import { Bookmark } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import type { SavedBook } from '../types';
import { useReadingList } from '../useReadingList';

interface SaveToListButtonProps {
  book: SavedBook;
}

export default function SaveToListButton({ book }: SaveToListButtonProps) {
  const { getStatus, add, remove } = useReadingList();
  const isSaved = getStatus(book.id) !== undefined;
  const label = isSaved ? `Quitar ${book.title} de mi lista` : `Guardar ${book.title} en mi lista`;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (isSaved ? remove(book.id) : add(book))}
      aria-pressed={isSaved}
      aria-label={label}
      title={isSaved ? 'Quitar de mi lista' : 'Guardar en mi lista'}
      className={cn(
        'w-8 h-8 rounded-full bg-surface-container-lowest/90 hover:bg-surface-container-lowest backdrop-blur shadow-sm transition-colors [&_svg]:size-[18px]',
        isSaved ? 'text-secondary hover:text-secondary' : 'text-on-surface hover:text-secondary'
      )}
      type="button"
    >
      <Bookmark className={cn(isSaved && 'fill-current')} />
    </Button>
  );
}
