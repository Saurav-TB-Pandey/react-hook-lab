import { useCallback, useEffect, useRef } from "react";

export interface UseTimeoutReturn {
  start: () => void;
  clear: () => void;
  restart: () => void;
  isActive: () => boolean;
}

export function useTimeout(
  callback: () => void,
  delay: number
): UseTimeoutReturn {
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
