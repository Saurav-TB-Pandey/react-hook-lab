import { useCallback, useState } from "react";

export interface ClipboardState {
  copied: boolean;
  error: Error | null;
}

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
