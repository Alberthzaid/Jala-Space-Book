import { useEffect, useRef } from 'react';

interface FormAlertProps {
  message: string;
  tone?: 'error' | 'info';
}

export default function FormAlert({ message, tone = 'error' }: FormAlertProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tone === 'error') ref.current?.focus();
  }, [message, tone]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'p-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium outline-none'
          : 'p-3 rounded-xl bg-secondary-fixed text-primary text-sm font-medium outline-none'
      }
    >
      {message}
    </div>
  );
}
