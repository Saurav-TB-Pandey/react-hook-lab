import { useCallback, useState } from "react";

export interface UseCounterOptions {
  min?: number;
  max?: number;
  step?: number;
}

export interface UseCounterReturn {
  count: number;
  set: (value: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

/**
 * Manage numeric state with built-in min and max bounds and step increments.
 *
 * @param initialValue - The initial counter value (default: 0).
 * @param options - Configuration object with `min`, `max`, and `step`.
 * @returns Array tuple containing the current count and modifier methods.
 *
 * @example
 * ```tsx
 * const [count, { increment, decrement }] = useCounter(1, { min: 1, max: 10 });
 * return <button onClick={increment}>Add: {count}</button>;
 * ```
 */
export function useCounter(initialValue = 0, options: UseCounterOptions = {}): UseCounterReturn {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, step = 1 } = options;

  const [count, setCount] = useState(initialValue);

  const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [min, max]);

  const set = useCallback(
    (value: number) => {
      setCount(clamp(value));
    },
    [clamp]
  );

  const increment = useCallback(() => {
    setCount((prev) => clamp(prev + step));
  }, [step, clamp]);

  const decrement = useCallback(() => {
    setCount((prev) => clamp(prev - step));
  }, [step, clamp]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    set,
    increment,
    decrement,
    reset,
  };
}
