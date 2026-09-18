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
 * Safely clamps initial and reset values within min/max range.
 *
 * @param initialValue - The initial counter value (default: 0).
 * @param options - Configuration object with `min`, `max`, and `step`.
 * @returns Object containing the current count and modifier methods (`set`, `increment`, `decrement`, `reset`).
 *
 * @example
 * ```tsx
 * const { count, increment, decrement, reset } = useCounter(1, { min: 1, max: 10 });
 * return <button onClick={increment}>Add: {count}</button>;
 * ```
 */
export function useCounter(initialValue = 0, options: UseCounterOptions = {}): UseCounterReturn {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, step = 1 } = options;

  const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [min, max]);

  const [count, setCount] = useState(() => clamp(initialValue));

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
    setCount(clamp(initialValue));
  }, [initialValue, clamp]);

  return {
    count,
    set,
    increment,
    decrement,
    reset,
  };
}

export default useCounter;
