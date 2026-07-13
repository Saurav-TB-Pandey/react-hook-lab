import { RefObject, useEffect, useState } from "react";

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export interface UseIntersectionObserverReturn {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

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
