import { useEffect, useState } from "react";

export interface UseAsyncDebounceReturn<T> {
  result: T | undefined;
  loading: boolean;
  error: unknown;
}

/**
 * Debounces an asynchronous callback, useful for preventing spam API calls
 * when a user types in a search box. It manages loading state and only
 * resolves the final promise after the debounce delay.
 *
 * @param asyncFunction - The asynchronous function to debounce.
 * @param delay - The debounce delay in milliseconds (default: 300).
 * @returns Object containing the result, loading state, error, and the debounced execution function.
 *
 * @example
 * ```tsx
 * const fetchAutocomplete = useAsyncDebounce(async (query) => {
 *   return await api.get(`/search?q=${query}`);
 * }, 300);
 * ```
 */
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
