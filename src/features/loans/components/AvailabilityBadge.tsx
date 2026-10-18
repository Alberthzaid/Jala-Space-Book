import { CheckCircle2, Clock, Hourglass } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { getAvailabilityStatus, type AvailabilityKind } from '../api/availability';
import type { Availability } from '../types';

const STYLES: Record<AvailabilityKind, string> = {
  available: 'bg-secondary-fixed text-primary',
  on_loan: 'bg-surface-container-high text-on-surface',
  reserved: 'bg-tertiary-fixed text-on-tertiary-fixed',
};

const ICONS = { available: CheckCircle2, on_loan: Clock, reserved: Hourglass } as const;

interface AvailabilityBadgeProps {
  availability: Availability | undefined;
  className?: string;
}

export default function AvailabilityBadge({ availability, className }: AvailabilityBadgeProps) {
  if (!availability) return null;
  const { kind, label } = getAvailabilityStatus(availability);
  const Icon = ICONS[kind];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
        STYLES[kind],
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      <span>
        <span className="sr-only">Disponibilidad: </span>
        {label}
      </span>
    </span>
  );
}
