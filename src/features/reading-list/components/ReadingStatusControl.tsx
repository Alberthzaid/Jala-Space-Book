import { Check } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { READING_STATUSES, READING_STATUS_LABELS, isReadingStatus } from '../lib/readingList';
import type { ReadingStatus } from '../types';

interface ReadingStatusControlProps {
  status: ReadingStatus | undefined;
  onChange: (status: ReadingStatus) => void;
  label: string;
}

export default function ReadingStatusControl({ status, onChange, label }: ReadingStatusControlProps) {
  return (
    <Tabs value={status ?? ''} onValueChange={(value) => isReadingStatus(value) && onChange(value)}>
      <TabsList
        aria-label={label}
        className="h-auto w-full grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl text-on-surface-variant"
      >
        {READING_STATUSES.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            className="py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 text-on-surface-variant hover:text-on-surface data-[state=active]:bg-surface-container-lowest data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {status === option && <Check className="size-3.5" aria-hidden="true" />}
            <span>{READING_STATUS_LABELS[option]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
