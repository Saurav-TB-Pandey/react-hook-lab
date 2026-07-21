import { useCallback, useState } from "react";

export interface ClipboardState {
  copied: boolean;
  error: Error | null;
}

/**
 * Reads and writes text to the user's clipboard, managing a temporary "copied" state.
 * Great for "Copy to Clipboard" buttons.
 *
 * @param timeout - The duration in milliseconds before the `copied` state resets to false (default: 2000).
 * @returns Object containing the copy function, current copied state, and any errors.
 *
 * @example
 * ```tsx
 * const { copy, copied } = useClipboard(2000);
 * return <button onClick={() => copy("text")}>{copied ? "Copied!" : "Copy"}</button>;
 * ```
 */
export const useClipboard = (timeout = 2000) => {
  const [{ copied, error }, setState] = useState<ClipboardState>({
    copied: false,
    error: null,
  });

  const copy = useCallback(
    async (text: string) => {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        setState({
          copied: false,
          error: new Error("Clipboard API is not supported."),
        });
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);

        setState({
          copied: true,
          error: null,
        });

        setTimeout(() => {
          setState({
            copied: false,
            error: null,
          });
        }, timeout);

        return true;
      } catch (err) {
        setState({
          copied: false,
          error: err as Error,
        });

        return false;
      }
    },
    [timeout]
  );

  return {
    copied,
    error,
    copy,
  };
};
