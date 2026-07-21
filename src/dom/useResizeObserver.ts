import { RefObject, useEffect, useState } from "react";

export interface Size {
  width: number;
  height: number;
}

export interface UseResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

export interface UseResizeObserverReturn {
  width: number;
  height: number;
  size: Size;
  entry?: ResizeObserverEntry;
}

/**
 * Reacts to changes in a DOM element's dimensions using the native ResizeObserver API.
 * Similar to `useElementSize`, but returns the full `ResizeObserverEntry` for advanced use cases.
 *
 * @param ref - The React ref attached to the element.
 * @param options - Native ResizeObserver options.
 * @returns The latest `ResizeObserverEntry` or `null`.
 *
 * @example
 * ```tsx
 * const ref = useRef(null);
 * const entry = useResizeObserver(ref);
 * return <div ref={ref}>Width: {entry?.contentRect.width}</div>;
 * ```
 */
export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T>,
  options: UseResizeObserverOptions = {}
): UseResizeObserverReturn {
  const { box = "content-box" } = options;

  const [entry, setEntry] = useState<ResizeObserverEntry>();

  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("ResizeObserver" in window)) return;

    const element = ref.current;

    if (!element) return;

    const observer = new ResizeObserver(([observerEntry]) => {
      const { width, height } = observerEntry.contentRect;

      setEntry(observerEntry);

      setSize((prev) => {
        if (prev.width === width && prev.height === height) {
          return prev;
        }

        return {
          width,
          height,
        };
      });
    });

    observer.observe(element, { box });

    return () => {
      observer.disconnect();
    };
  }, [ref, box]);

  return {
    width: size.width,
    height: size.height,
    size,
    entry,
  };
}
