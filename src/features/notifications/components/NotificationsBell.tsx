import { Bell } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { useNotifications } from '../useNotifications';

export default function NotificationsBell() {
  const { notices, dismissAll } = useNotifications();
  const count = notices.length;
  const label =
    count === 0 ? 'Sin avisos de disponibilidad' : `${count} ${count === 1 ? 'aviso' : 'avisos'} de disponibilidad. Descartar todos`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={dismissAll}
      disabled={count === 0}
      aria-label={label}
      title={label}
      className="relative h-9 w-9 rounded-xl text-on-surface-variant hover:bg-surface-container disabled:opacity-100 [&_svg]:size-5"
    >
      <Bell aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center"
        >
          {count}
        </span>
      )}
    </Button>
  );
}
