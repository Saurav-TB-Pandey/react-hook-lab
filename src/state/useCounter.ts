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
