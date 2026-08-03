import { useState, useEffect, useCallback, useRef, type RefObject } from "react";

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

/**
 * Safely gets the current fullscreen element across various browser implementations.
 * @returns {Element | null} The fullscreen element if active, otherwise null.
 */
function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;

  const doc = document as FullscreenDocument;
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

/**
 * Return type for the `useFullscreen` hook.
 */
export interface UseFullscreenReturn<T extends HTMLElement> {
  /**
   * Ref to attach to the element you want to make fullscreen.
   */
  ref: RefObject<T>;
  /**
   * Boolean indicating whether the targeted element (or the document) is currently in fullscreen mode.
   */
  isFullscreen: boolean;
  /**
   * Any Error object caught during fullscreen transitions, or null if successful.
   */
  error: Error | null;
  /**
   * Requests the browser to place the referenced element into fullscreen mode.
   */
  enter: () => Promise<void>;
  /**
   * Requests the browser to exit fullscreen mode.
   */
  exit: () => Promise<void>;
  /**
   * Toggles the fullscreen state. If currently fullscreen, it will exit. If not, it will enter.
   */
  toggle: () => Promise<void>;
}

/**
 * A hook that provides a robust, cross-browser compatible way to make any DOM element fullscreen.
 *
 * It manages the native Browser Fullscreen API and tracks the active fullscreen state.
 *
 * @template T - The HTML element type the ref will be attached to.
 * @returns {UseFullscreenReturn<T>} Object containing the ref to attach, state variables, and control methods.
 */
export function useFullscreen<T extends HTMLElement = HTMLDivElement>(): UseFullscreenReturn<T> {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleChange = () => {
      setIsFullscreen(!!getFullscreenElement());
    };

    // Synchronize initial state in case the element is already fullscreen on mount
    handleChange();

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, []);

  const enter = useCallback(async () => {
    if (typeof document === "undefined") return;

    // If no ref is provided, attempt to make the whole document (documentElement) fullscreen
    const el = (ref.current || document.documentElement) as FullscreenElement;

    if (!el) {
      setError(new Error("No element attached to fullscreen ref and no documentElement available"));
      return;
    }

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      } else {
        throw new Error("Fullscreen API is not supported in this browser");
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const exit = useCallback(async () => {
    if (typeof document === "undefined") return;

    // Do not attempt to exit if we are not currently in fullscreen
    if (!getFullscreenElement()) {
      return;
    }

    const doc = document as FullscreenDocument;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const toggle = useCallback(async () => {
    // Determine state directly from the DOM to maintain strict reference stability of this callback
    if (getFullscreenElement()) {
      await exit();
    } else {
      await enter();
    }
  }, [enter, exit]);

  return { ref, isFullscreen, error, enter, exit, toggle };
}
