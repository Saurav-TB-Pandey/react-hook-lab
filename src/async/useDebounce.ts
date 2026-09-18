import { useEffect, useRef, useState } from "react";

export interface UseDebounceOptions<T> {
  initialValue?: T;
  leading?: boolean;
  /**
   * If true, string values will have leading and trailing whitespace trimmed.
   * Defaults to true for string types to maintain backwards compatibility.
   * Set to `false` if spaces should be strictly preserved (e.g. text inputs).
   * @default true
   */
  trim?: boolean;
}

/**
 * Debounces a fast-changing state value. The returned value will only reflect
 * the latest value after the specified delay has passed without further updates.
 *
 * @param value - The state value to debounce.
 * @param delay - The delay in milliseconds (default: 300).
 * @param options - Additional options (`initialValue`, `leading`, and `trim`).
 * @returns The debounced value.
 *
 * @example
 * ```tsx
 * const [term, setTerm] = useState("");
 * const debouncedTerm = useDebounce(term, 500);
 * // To preserve raw input whitespace without trimming:
 * const debouncedRaw = useDebounce(term, 500, { trim: false });
 * ```
 */
export function useDebounce<T>(value: T, delay = 300, options: UseDebounceOptions<T> = {}): T {
  const { initialValue = value, leading = false, trim = true } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (leading && isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    const timeout = setTimeout(() => {
      const nextValue = typeof value === "string" && trim ? value.trim() : value;

      setDebouncedValue(nextValue as T);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, leading, trim]);

  return debouncedValue;
}

export default useDebounce;
