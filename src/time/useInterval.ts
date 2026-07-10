import { useCallback, useEffect, useRef } from "react";

export interface UseIntervalReturn {
  start: () => void;
  stop: () => void;
  restart: () => void;
  isRunning: () => boolean;
}

export function useInterval(
  callback: () => void,
  delay: number
): UseIntervalReturn {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const start = useCallback(() => {
    stop();

    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, delay);
  }, [delay, stop]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const isRunning = useCallback(() => {
    return intervalRef.current !== undefined;
  }, []);

  useEffect(() => {
    start();

    return stop;
  }, [start, stop]);

  return {
    start,
    stop,
    restart,
    isRunning,
  };
}
