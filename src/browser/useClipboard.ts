import { useCallback, useEffect, useRef, useState } from "react";

export interface ClipboardState {
  copied: boolean;
  error: Error | null;
}

export interface UseClipboardReturn extends ClipboardState {
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Reads and writes text to the user's clipboard, managing a temporary "copied" state.
 * Great for "Copy to Clipboard" buttons. Safely cleans up timers on unmount.
 *
 * @param timeout - The duration in milliseconds before the `copied` state resets to false (default: 2000).
 * @returns Object containing the copy function, reset function, current copied state, and any errors.
 *
 * @example
 * ```tsx
 * const { copy, copied } = useClipboard(2000);
 * return <button onClick={() => copy("text")}>{copied ? "Copied!" : "Copy"}</button>;
 * ```
 */
export const useClipboard = (timeout = 2000): UseClipboardReturn => {
  const [{ copied, error }, setState] = useState<ClipboardState>({
    copied: false,
    error: null,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isMountedRef.current) {
      setState({ copied: false, error: null });
    }
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (typeof navigator === "undefined" || !navigator.clipboard) {
        if (isMountedRef.current) {
          setState({
            copied: false,
            error: new Error("Clipboard API is not supported."),
          });
        }
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);

        if (!isMountedRef.current) return true;

        setState({
          copied: true,
          error: null,
        });

        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setState({
              copied: false,
              error: null,
            });
          }
          timeoutRef.current = null;
        }, timeout);

        return true;
      } catch (err: unknown) {
        if (!isMountedRef.current) return false;

        setState({
          copied: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });

        return false;
      }
    },
    [timeout]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    copied,
    error,
    copy,
    reset,
  };
};

export default useClipboard;
