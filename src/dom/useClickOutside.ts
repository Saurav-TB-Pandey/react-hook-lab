import { RefObject, useEffect } from "react";

type EventType =
  "mousedown" | "mouseup" | "touchstart" | "touchend" | "pointerdown" | "pointerup" | "click";

export interface UseClickOutsideOptions {
  enabled?: boolean;
  events?: EventType[];
}

/**
 * Detects clicks outside of a specified element.
 * Perfect for closing dropdowns, modals, and tooltips when a user clicks away.
 *
 * @param ref - The React ref attached to the element you want to detect clicks outside of.
 * @param handler - The callback function to fire when an outside click is detected.
 *
 * @example
 * ```tsx
 * const ref = useRef(null);
 * useClickOutside(ref, () => setIsOpen(false));
 * return <div ref={ref}>Dropdown Content</div>;
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T> | RefObject<T>[],
  handler: (event: Event) => void,
  options: UseClickOutsideOptions = {}
) {
  const { enabled = true, events = ["mousedown", "touchstart"] } = options;

  useEffect(() => {
    if (!enabled) return;

    if (typeof document === "undefined") return;

    const refs = Array.isArray(ref) ? ref : [ref];

    const listener = (event: Event) => {
      const target = event.target as Node | null;

      if (!target) return;

      const clickedInside = refs.some((currentRef) => {
        return currentRef.current?.contains(target);
      });

      if (!clickedInside) {
        handler(event);
      }
    };

    events.forEach((eventName) => document.addEventListener(eventName, listener));

    return () => {
      events.forEach((eventName) => document.removeEventListener(eventName, listener));
    };
  }, [ref, handler, enabled, events]);
}
