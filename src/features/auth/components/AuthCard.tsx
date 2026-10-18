import type { ReactNode } from 'react';

import { Card } from '@/shared/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full px-4 py-10 flex justify-center">
      <Card className="w-full max-w-md p-6 sm:p-8 rounded-2xl border-0 bg-surface-container-lowest shadow-sm flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-primary tracking-tight">{title}</h1>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </header>
        {children}
        {footer && <div className="text-sm text-on-surface-variant text-center">{footer}</div>}
      </Card>
    </div>
  );
}
