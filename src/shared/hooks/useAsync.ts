import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data?: T;
  error?: unknown;
}

export interface AsyncResult<T> extends AsyncState<T> {
  retry: () => void;
}

export type AsyncTask<T> = (signal: AbortSignal) => Promise<T>;

export function useAsync<T>(task: AsyncTask<T> | null, deps: DependencyList): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: task ? 'loading' : 'idle' });
  const [attempt, setAttempt] = useState(0);
  const isIdle = task === null;

  useEffect(() => {
    if (!task) {
      setState({ status: 'idle' });
      return undefined;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });
    task(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      }
    );
    return () => controller.abort();
  },[...deps, isIdle, attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  return { ...state, retry };
}
