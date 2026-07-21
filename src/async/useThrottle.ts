import { useEffect, useRef, useState } from "react";

export interface UseThrottleOptions {
  /**
   * Invoke immediately on the first call.
   * Default: true
   */
  leading?: boolean;

  /**
   * Invoke once more after the delay
   * with the latest value.
   * Default: true
   */
  trailing?: boolean;
}

/**
 * Throttles a state value so that it updates at most once every specified number of milliseconds.
 * Useful for handling rapid events like scrolling or resizing.
 *
 * @param value - The value to throttle.
 * @param delay - The throttle window in milliseconds (default: 300).
 * @param options - Additional options.
 * @returns The throttled value.
 *
 * @example
 * ```tsx
 * const [scroll, setScroll] = useState(0);
 * const throttledScroll = useThrottle(scroll, 200);
 * // throttledScroll updates maximally once every 200ms regardless of scroll speed
 * ```
 */
export function useThrottle<T>(value: T, delay = 300, options: UseThrottleOptions = {}): T {
  const { leading = true, trailing = true } = options;

  const [throttledValue, setThrottledValue] = useState(value);

  const lastExecuted = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;

    const now = Date.now();

    const remaining = delay - (now - lastExecuted.current);

    // First execution
    if (lastExecuted.current === 0 && leading) {
      lastExecuted.current = now;
      setThrottledValue(value);
      return;
    }

    // Enough time has passed
    if (remaining <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      lastExecuted.current = now;
      setThrottledValue(value);
      return;
    }

    // Schedule trailing execution
    if (trailing && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastExecuted.current = Date.now();
        timeoutRef.current = null;
        setThrottledValue(latestValue.current);
      }, remaining);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay, leading, trailing]);

  return throttledValue;
}
