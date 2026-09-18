import { useEffect, useRef, useState } from "react";

export interface UseTabVisibilityOptions {
  /**
   * Callback fired once for each inactive -> active transition
   * after the initial mount baseline synchronization.
   */
  onActivate?: () => void;

  /**
   * Callback fired once for each active -> inactive transition
   * after the initial mount baseline synchronization.
   */
  onDeactivate?: () => void;

  /**
   * Require the browser document to be focused in addition
   * to being visible for the tab to be considered active.
   *
   * When false, document visibility alone determines activity.
   *
   * Changing this option after mount can produce an active/inactive
   * transition and invoke the corresponding callback.
   *
   * @default true
   */
  requireWindowFocus?: boolean;

  /**
   * SSR-safe initial value before the first client-side measurement.
   *
   * @default true
   */
  initialActive?: boolean;
}

export interface UseTabVisibilityResult {
  /**
   * True when the document is considered active.
   * When `requireWindowFocus` is true, the document must be both visible and focused.
   */
  isActive: boolean;

  /**
   * The previously confirmed active state.
   * Remains `undefined` until the first real transition occurs,
   * avoiding false-positive triggers during initial hydration.
   */
  wasActive: boolean | undefined;

  /**
   * Direct visibility state (`document.visibilityState === "visible"`).
   */
  isVisible: boolean;

  /**
   * Direct document/window focus state.
   */
  isFocused: boolean;

  /**
   * Timestamp (ms) when this hook most recently confirmed the document
   * as active, or null if it has never been confirmed active.
   */
  lastActiveAt: number | null;

  /**
   * Timestamp (ms) when this hook most recently confirmed the document
   * as inactive, or null if it has never been confirmed inactive.
   */
  lastInactiveAt: number | null;
}

const getIsDocVisible = (): boolean => {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
};

const getHasFocus = (): boolean => {
  if (typeof document === "undefined") return true;
  return document.hasFocus();
};

/**
 * Tracks whether the browser document is currently active with zero-tearing SSR safety.
 *
 * Activity is derived from document visibility and (optionally) window focus.
 * Accurately handles multi-monitor focus, mobile browser freeze/resume (BFCache),
 * and avoids false-positive transitions during initial hydration.
 *
 * @param options - Configuration options and transition callbacks.
 * @returns {UseTabVisibilityResult} State booleans, confirmed previous state, and transition timestamps.
 *
 * @example
 * ```tsx
 * const { isActive, isVisible, isFocused } = useTabVisibility({
 *   onActivate: () => playVideo(),
 *   onDeactivate: () => pauseVideo(),
 * });
 * ```
 */
export function useTabVisibility(options: UseTabVisibilityOptions = {}): UseTabVisibilityResult {
  const { onActivate, onDeactivate, requireWindowFocus = true, initialActive = true } = options;

  const [isActive, setIsActive] = useState(initialActive);
  const [wasActive, setWasActive] = useState<boolean | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(initialActive);
  const [isFocused, setIsFocused] = useState(initialActive);
  const [lastActiveAt, setLastActiveAt] = useState<number | null>(null);
  const [lastInactiveAt, setLastInactiveAt] = useState<number | null>(null);

  const isActiveRef = useRef(initialActive);
  const visibleRef = useRef(initialActive);
  const focusedRef = useRef(initialActive);
  const hasInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  const onActivateRef = useRef(onActivate);
  const onDeactivateRef = useRef(onDeactivate);
  onActivateRef.current = onActivate;
  onDeactivateRef.current = onDeactivate;

  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const computeActiveState = (): boolean =>
      requireWindowFocus ? visibleRef.current && focusedRef.current : visibleRef.current;

    const applyState = (): void => {
      if (!isMountedRef.current) return;

      const nextActive = computeActiveState();
      const currentVisible = visibleRef.current;
      const currentFocused = focusedRef.current;
      const now = Date.now();

      setIsVisible(currentVisible);
      setIsFocused(currentFocused);

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        isActiveRef.current = nextActive;
        setIsActive(nextActive);

        if (nextActive) {
          setLastActiveAt(now);
        } else {
          setLastInactiveAt(now);
        }
        return;
      }

      if (nextActive === isActiveRef.current) {
        return;
      }

      const previousConfirmed = isActiveRef.current;
      isActiveRef.current = nextActive;

      setWasActive(previousConfirmed);
      setIsActive(nextActive);

      if (nextActive) {
        setLastActiveAt(now);
        onActivateRef.current?.();
      } else {
        setLastInactiveAt(now);
        onDeactivateRef.current?.();
      }
    };

    const handleVisibilityChange = (): void => {
      visibleRef.current = getIsDocVisible();
      applyState();
    };

    const handleFocus = (): void => {
      focusedRef.current = true;
      applyState();
    };

    const handleBlur = (): void => {
      focusedRef.current = false;
      applyState();
    };

    const handlePageShow = (): void => {
      visibleRef.current = true;
      focusedRef.current = getHasFocus();
      applyState();
    };

    const handlePageHide = (): void => {
      visibleRef.current = false;
      applyState();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);

    if (requireWindowFocus) {
      window.addEventListener("focus", handleFocus);
      window.addEventListener("blur", handleBlur);
    }

    visibleRef.current = getIsDocVisible();
    focusedRef.current = getHasFocus();
    applyState();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);

      if (requireWindowFocus) {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("blur", handleBlur);
      }
    };
  }, [requireWindowFocus]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    isActive,
    wasActive,
    isVisible,
    isFocused,
    lastActiveAt,
    lastInactiveAt,
  };
}

export default useTabVisibility;
