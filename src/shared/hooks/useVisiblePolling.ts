import { useEffect, useRef } from 'react';

export function useVisiblePolling(callback: () => void, intervalMs: number, enabled: boolean): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    const tick = () => {
      if (document.visibilityState === 'visible') callbackRef.current();
    };
    tick();
    const timer = window.setInterval(tick, intervalMs);
    const onVisibilityChange = () => tick();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
