import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
];

const THROTTLE_MS = 500;

/**
 * A React hook that detects user inactivity across the browser window.
 * Event listeners are automatically throttled for maximum performance.
 * 
 * @param {number} timeout - The duration in milliseconds of inactivity required before the user is considered idle (default: 60000ms).
 * @param {(keyof WindowEventMap)[]} events - An array of DOM events to listen to for activity (e.g., `["mousemove", "keydown"]`).
 * @returns {boolean} `true` if the user is currently idle, `false` otherwise.
 */
export function useIdle(timeout = 60000, events: (keyof WindowEventMap)[] = DEFAULT_EVENTS): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActiveRef = useRef<number>(0);
  const isIdleRef = useRef<boolean>(false);

  const resetTimer = useCallback(() => {
    const now = performance.now();
    
    // Throttle the resets so we aren't clearing/setting timeouts on every pixel of mouse movement
    if (now - lastActiveRef.current < THROTTLE_MS) {
       return;
    }
    lastActiveRef.current = now;

    if (isIdleRef.current) {
      setIsIdle(false);
      isIdleRef.current = false;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsIdle(true);
      isIdleRef.current = true;
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    resetTimer();

    events.forEach((event) =>
      window.addEventListener(event, resetTimer as EventListener, { passive: true }),
    );

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer as EventListener));

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [events, resetTimer]);

  return isIdle;
}

export default useIdle;
