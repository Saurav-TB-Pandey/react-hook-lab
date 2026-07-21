import { useEffect, useRef } from "react";

/**
 * Access the previous value of a state or prop after a render.
 *
 * @param value - The value to track.
 * @param defaultValue - Optional default value to return on the very first render before a previous value exists.
 * @returns The previous value.
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 * return <div>Now: {count}, Before: {prevCount}</div>;
 * ```
 */
export function usePrevious<T>(value: T): T | undefined;

export function usePrevious<T>(value: T, defaultValue: T): T;

export function usePrevious<T>(value: T, defaultValue?: T): T | undefined {
  const ref = useRef<T | undefined>(defaultValue);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
