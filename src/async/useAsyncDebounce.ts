import { useEffect, useState } from "react";

export interface UseAsyncDebounceReturn<T> {
  result: T | undefined;
  loading: boolean;
  error: unknown;
}

export function useAsyncDebounce<T>(
  callback: () => T | Promise<T>,
  delay = 300
): UseAsyncDebounceReturn<T> {
  const [result, setResult] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    let cancelled = false;

    const timerId = setTimeout(() => {
      setLoading(true);
      setError(undefined);

      Promise.resolve(callback())
        .then((value) => {
          if (!cancelled) {
            setResult(value);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [callback, delay]);

  return { result, loading, error };
}
