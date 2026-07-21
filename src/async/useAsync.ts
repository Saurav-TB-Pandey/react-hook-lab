import { DependencyList, useCallback, useEffect, useRef, useState } from "react";

export interface UseAsyncOptions<T> {
  immediate?: boolean;
  initialData?: T;
}

export interface UseAsyncReturn<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;

  execute: () => Promise<T | undefined>;
  retry: () => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Manages complex asynchronous data fetching with a robust state object.
 * Automatically handles race conditions and prevents stale responses if the component unmounts or dependencies change.
 *
 * @param asyncFunction - The asynchronous function returning a Promise.
 * @param dependencies - Array of dependencies that trigger a re-execution when changed.
 * @param options - Configuration options (`immediate` execution, `initialData`).
 * @returns Object containing data, error, loading state, and functions to retry, reset, or manually execute.
 *
 * @example
 * ```tsx
 * const { execute, status, value, error } = useAsync(
 *   () => fetch(`/api/users/${userId}`).then(res => res.json()),
 *   [userId]
 * );
 * ```
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: DependencyList = [],
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
  const { immediate = true, initialData } = options;

  const [data, setData] = useState<T | undefined>(initialData);

  const [loading, setLoading] = useState(immediate);

  const [error, setError] = useState<Error | null>(null);

  // Prevent stale responses
  const requestId = useRef(0);

  const execute = useCallback(async () => {
    const id = ++requestId.current;

    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();

      // Ignore stale response
      if (id !== requestId.current) {
        return;
      }

      setData(result);

      return result;
    } catch (err) {
      if (id !== requestId.current) {
        return;
      }

      setError(err as Error);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction]);

  const retry = useCallback(() => execute(), [execute]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    error,
    loading,
    execute,
    retry,
    reset,
  };
}
