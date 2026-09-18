import { useEffect, useRef, useState, type DependencyList } from "react";

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
 * @param callback - The asynchronous function to execute after the debounce delay.
 * @param delay - The debounce delay in milliseconds (default: 300).
 * @param dependencies - Optional explicit dependency list that triggers a re-debounce when changed.
 * @returns Object containing the result, loading state, and error.
 *
 * @example
 * ```tsx
 * const { result, loading, error } = useAsyncDebounce(
 *   async () => api.get(`/search?q=${query}`),
 *   300,
 *   [query]
 * );
 * ```
 */
export function useAsyncDebounce<T>(
  callback: () => T | Promise<T>,
  delay = 300,
  dependencies?: DependencyList
): UseAsyncDebounceReturn<T> {
  const [result, setResult] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const deps = dependencies !== undefined ? dependencies : [callback];

  useEffect(() => {
    let cancelled = false;

    const timerId = setTimeout(() => {
      setLoading(true);
      setError(undefined);

      Promise.resolve(callbackRef.current())
        .then((value) => {
          if (!cancelled) {
            setResult(value);
          }
        })
        .catch((err: unknown) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...deps]);

  return { result, loading, error };
}

export default useAsyncDebounce;
