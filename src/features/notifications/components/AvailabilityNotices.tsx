import { Link } from 'react-router-dom';
import { BellRing, X } from 'lucide-react';

import { getBookDetailPath } from '@/shared/lib/paths';
import { Button } from '@/shared/ui/button';
import { useNotifications } from '../useNotifications';

export default function AvailabilityNotices() {
  const { notices, dismiss } = useNotifications();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Avisos de disponibilidad"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
    >
      {notices.slice(0, 3).map((notice) => (
        <div key={notice.key} className="p-3 rounded-2xl bg-surface-container-lowest shadow-lg flex gap-3 items-start">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary-fixed text-primary flex items-center justify-center">
            <BellRing className="size-4" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 text-sm">
            <p className="text-on-surface">
              <strong className="font-semibold">«{notice.title}»</strong> ya está disponible
              {notice.kind === 'reservation' ? ' (lo reservaste).' : ' (está en tu lista «Quiero leer»).'}
            </p>
            <Link
              to={getBookDetailPath(notice.workId)}
              onClick={() => dismiss(notice.key)}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Ver libro y pedirlo prestado
            </Link>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => dismiss(notice.key)}
            aria-label={`Descartar aviso de ${notice.title}`}
            className="h-auto w-auto p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high [&_svg]:size-4"
          >
            <X />
          </Button>
        </div>
      ))}
    </div>
  );
}
