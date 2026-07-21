import { RefObject, useEffect, useState } from "react";

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * Detects whether a DOM element is currently visible in the viewport.
 * Ideal for lazy loading images, infinite scrolling, or triggering animations on scroll.
 *
 * @param ref - The React ref attached to the element to observe.
 * @param options - Standard IntersectionObserverInit options (threshold, rootMargin, etc.).
 * @returns The latest `IntersectionObserverEntry` or `null`.
 *
 * @example
 * ```tsx
 * const ref = useRef(null);
 * const entry = useIntersectionObserver(ref, { threshold: 0.1 });
 * const isVisible = !!entry?.isIntersecting;
 * return <img ref={ref} src={isVisible ? src : placeholder} />;
 * ```
 */
export function useIntersectionObserver<T extends HTMLElement>(
  ref: RefObject<T>,
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { threshold = 0, root = null, rootMargin = "0px", freezeOnceVisible = false } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry>();

  const frozen = freezeOnceVisible && entry?.isIntersecting;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("IntersectionObserver" in window)) return;

    const element = ref.current;

    if (!element || frozen) return;

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setEntry(observerEntry);
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, root, rootMargin, frozen]);

  return {
    isIntersecting: !!entry?.isIntersecting,
    entry,
  };
}
