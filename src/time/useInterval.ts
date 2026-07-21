import { useCallback, useEffect, useRef } from "react";

export interface UseIntervalReturn {
  start: () => void;
  stop: () => void;
  restart: () => void;
  isRunning: () => boolean;
}

/**
 * A declarative `setInterval` hook that safely handles cleanup and React's closure staleness issues.
 *
 * @param callback - The function to execute.
 * @param delay - The delay in milliseconds.
 * @returns Object containing methods to stop, start, restart, and check the running status of the interval.
 *
 * @example
 * ```tsx
 * const [time, setTime] = useState(0);
 * const interval = useInterval(() => setTime(t => t + 1), 1000);
 * return <button onClick={interval.stop}>Stop Interval</button>;
 * ```
 */
export function useInterval(callback: () => void, delay: number): UseIntervalReturn {
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
