import { useCallback, useEffect, useRef } from "react";

export interface UseTimeoutReturn {
  start: () => void;
  clear: () => void;
  restart: () => void;
  isActive: () => boolean;
}

/**
 * A declarative `setTimeout` hook that safely handles cleanup.
 *
 * @param callback - The function to execute.
 * @param delay - The delay in milliseconds.
 * @returns Object containing methods to stop, start, restart, and check the active status of the timeout.
 *
 * @example
 * ```tsx
 * const [show, setShow] = useState(true);
 * useTimeout(() => setShow(false), 5000);
 * if (!show) return null;
 * return <div>This will disappear in 5 seconds!</div>;
 * ```
 */
export function useTimeout(callback: () => void, delay: number): UseTimeoutReturn {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const start = useCallback(() => {
    clear();

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
      callbackRef.current();
    }, delay);
  }, [delay, clear]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const isActive = useCallback(() => {
    return timeoutRef.current !== undefined;
  }, []);

  useEffect(() => {
    start();

    return clear;
  }, [start, clear]);

  return {
    start,
    clear,
    restart,
    isActive,
  };
}
