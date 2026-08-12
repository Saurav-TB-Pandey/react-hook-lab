import { useState, useCallback, useEffect, useRef, useMemo, type ReactNode, type FC } from "react";
import { createPortal } from "react-dom";

/**
 * Configuration options for the Document Picture-in-Picture window.
 */
export interface UsePipOptions {
  /** The initial width of the PIP window in pixels. */
  width?: number;
  /** The initial height of the PIP window in pixels. */
  height?: number;
}

/**
 * Return type for the usePip hook, containing state and control methods.
 */
export interface UsePipResult {
  /** True if the browser supports the Document Picture-in-Picture API. */
  isSupported: boolean;
  /** True if the PIP window is currently open. */
  isOpen: boolean;
  /**
   * Opens a new Picture-in-Picture window with the specified options.
   * Automatically copies stylesheets from the main document into the PIP window.
   * @param {UsePipOptions} [options] - Configuration options like width and height.
   * @returns {Promise<Window | undefined>} A promise resolving to the newly created PIP Window, or undefined if unsupported.
   */
  openPip: (options?: UsePipOptions) => Promise<Window | undefined>;
  /** Closes the currently active Picture-in-Picture window, if one exists. */
  closePip: () => void;
  /**
   * A React component that seamlessly portals its children into the PIP window.
   * Captures `width` and `height` options when passed as props.
   * Returns `null` if the PIP window is not currently open.
   */
  Pip: FC<UsePipOptions & { children: ReactNode }>;
}

type WindowWithPip = Window &
  typeof globalThis & {
    documentPictureInPicture: {
      window: Window | null;
      requestWindow: (options?: UsePipOptions) => Promise<Window>;
    };
  };

/**
 * Hook to portal React components into a separate Document Picture-in-Picture window.
 * It manages the lifecycle, styling inheritance, and state of the PIP window.
 *
 * @returns {UsePipResult} Object containing state and methods to manage the PIP window.
 *
 * @example
 * ```tsx
 * const { isSupported, isOpen, openPip, closePip, Pip } = usePip();
 *
 * return (
 *   <div>
 *     <button onClick={() => isOpen ? closePip() : openPip()}>
 *       {isOpen ? 'Close PIP' : 'Open PIP'}
 *     </button>
 *     <Pip width={300} height={300}>
 *       <MyComponent />
 *     </Pip>
 *   </div>
 * );
 * ```
 */
export function usePip(): UsePipResult {
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const optionsRef = useRef<UsePipOptions>({});
  const stateRef = useRef({ isOpen, container });
  stateRef.current = { isOpen, container };

  useEffect(() => {
    if (typeof window !== "undefined" && "documentPictureInPicture" in window) {
      setIsSupported(true);
    }
  }, []);

  // Close PIP window on unmount if this instance opened it
  useEffect(() => {
    return () => {
      if (
        stateRef.current.isOpen &&
        typeof window !== "undefined" &&
        "documentPictureInPicture" in window
      ) {
        const dpip = (window as unknown as WindowWithPip).documentPictureInPicture;
        if (dpip.window) {
          dpip.window.close();
        }
      }
    };
  }, []);

  const openPip = useCallback(async (options?: UsePipOptions) => {
    if (typeof window === "undefined" || !("documentPictureInPicture" in window)) {
      console.warn("documentPictureInPicture is not supported in this browser.");
      return;
    }

    try {
      const dpip = (window as unknown as WindowWithPip).documentPictureInPicture;
      const finalOptions = { ...optionsRef.current, ...options };
      const pipWindow = await dpip.requestWindow(finalOptions);

      const pipContainer = pipWindow.document.createElement("div");
      pipContainer.id = "pip-root";
      pipWindow.document.body.appendChild(pipContainer);

      // Copy styles
      Array.from(document.styleSheets).forEach((styleSheet) => {
        try {
          const cssRules = Array.from(styleSheet.cssRules || [])
            .map((rule) => rule.cssText)
            .join("");
          const style = pipWindow.document.createElement("style");
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch {
          // Fallback for cross-origin stylesheets
          if (styleSheet.href) {
            const link = pipWindow.document.createElement("link");
            link.rel = "stylesheet";
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        }
      });

      pipWindow.addEventListener("pagehide", () => {
        setIsOpen(false);
        setContainer(null);
      });

      setContainer(pipContainer);
      setIsOpen(true);
      return pipWindow;
    } catch (error) {
      console.error("Failed to open PIP window", error);
      throw error;
    }
  }, []);

  const closePip = useCallback(() => {
    if (
      stateRef.current.isOpen &&
      typeof window !== "undefined" &&
      "documentPictureInPicture" in window
    ) {
      const dpip = (window as unknown as WindowWithPip).documentPictureInPicture;
      if (dpip.window) {
        dpip.window.close();
      }
    }
  }, []);

  const Pip: FC<UsePipOptions & { children: ReactNode }> = useCallback(
    ({ children, width, height }) => {
      // Capture the latest options for openPip to use
      optionsRef.current = { width, height };

      const { isOpen: currentIsOpen, container: currentContainer } = stateRef.current;
      if (!currentIsOpen || !currentContainer) return null;

      return createPortal(children, currentContainer);
    },
    []
  );

  return useMemo(
    () => ({ isSupported, isOpen, openPip, closePip, Pip }),
    [isSupported, isOpen, openPip, closePip, Pip]
  );
}
