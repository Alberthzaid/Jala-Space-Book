import { Settings2 } from 'lucide-react';

import { supabaseConfigIssues } from '@/shared/api/supabase';
import { cn } from '@/shared/lib/utils';

interface SupabaseConfigNoticeProps {
  compact?: boolean;
  className?: string;
}

export default function SupabaseConfigNotice({ compact = false, className }: SupabaseConfigNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        'rounded-2xl bg-surface-container-lowest shadow-sm flex gap-3 items-start text-left',
        compact ? 'p-3' : 'p-6',
        className
      )}
    >
      <div className="w-10 h-10 shrink-0 rounded-xl bg-secondary-fixed text-primary flex items-center justify-center">
        <Settings2 className="size-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className={cn('font-bold text-primary', compact ? 'text-sm' : 'text-base')}>
          Configuración de Supabase pendiente
        </h2>
        <p className="text-sm text-on-surface-variant">
          Las cuentas y los préstamos necesitan Supabase. El catálogo y tu lista siguen funcionando.
        </p>
        {!compact && supabaseConfigIssues.length > 0 && (
          <p className="text-xs text-outline">
            Define {supabaseConfigIssues.join(' y ')} en <code>.env.local</code> (ver <code>.env.example</code>) y
            reinicia el servidor.
          </p>
        )}
      </div>
    </div>
  );
}
