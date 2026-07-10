import { useEffect, useRef, useState } from "react";

export interface UseDebounceOptions<T> {
  initialValue?: T;
  leading?: boolean;
}

export function useDebounce<T>(
  value: T,
  delay = 300,
  options: UseDebounceOptions<T> = {}
): T {
  const {
    initialValue = value,
    leading = false,
  } = options;

  const [debouncedValue, setDebouncedValue] =
    useState<T>(initialValue);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (leading && isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    const timeout = setTimeout(() => {
      const nextValue =
        typeof value === "string"
          ? value.trim()
          : value;

      setDebouncedValue(nextValue as T);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay, leading]);

  return debouncedValue;
}
