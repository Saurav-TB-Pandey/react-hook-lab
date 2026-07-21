import { useEffect, useRef, useState } from "react";

export interface UseDebounceOptions<T> {
  initialValue?: T;
  leading?: boolean;
}

/**
 * Debounces a fast-changing state value. The returned value will only reflect
 * the latest value after the specified delay has passed without further updates.
 *
 * @param value - The state value to debounce.
 * @param delay - The delay in milliseconds (default: 300).
 * @param options - Additional options (e.g., auto-trim strings).
 * @returns The debounced value.
 *
 * @example
 * ```tsx
 * const [term, setTerm] = useState("");
 * const debouncedTerm = useDebounce(term, 500);
 * // debouncedTerm only updates 500ms after the user stops typing
 * ```
 */
export function useDebounce<T>(value: T, delay = 300, options: UseDebounceOptions<T> = {}): T {
  const { initialValue = value, leading = false } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (leading && isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    const timeout = setTimeout(() => {
      const nextValue = typeof value === "string" ? value.trim() : value;

      setDebouncedValue(nextValue as T);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, leading]);

  return debouncedValue;
}
