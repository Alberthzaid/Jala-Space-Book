import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

export default function FormField({ id, label, error, hint, ...inputProps }: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-on-surface">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 rounded-xl bg-surface-container-low border-0 shadow-none text-sm text-on-surface focus-visible:ring-2 focus-visible:ring-secondary',
          error && 'ring-2 ring-error focus-visible:ring-error'
        )}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-xs text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
