import { useEffect, useRef, type RefObject } from "react";

type EventType =
  "mousedown" | "mouseup" | "touchstart" | "touchend" | "pointerdown" | "pointerup" | "click";

const DEFAULT_EVENTS: readonly EventType[] = ["mousedown", "touchstart"];

export interface UseClickOutsideOptions {
  enabled?: boolean;
  events?: EventType[];
}

/**
 * Detects clicks outside of a specified element.
 * Perfect for closing dropdowns, modals, and tooltips when a user clicks away.
 * Uses ref-forwarded handlers to avoid re-subscribing on each render.
 *
 * @param ref - The React ref attached to the element you want to detect clicks outside of.
 * @param handler - The callback function to fire when an outside click is detected.
 * @param options - Additional options including enabled flag and custom DOM events.
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
  const { enabled = true, events } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const eventsKey = events ? events.join(",") : DEFAULT_EVENTS.join(",");

  useEffect(() => {
    if (!enabled) return;

    if (typeof document === "undefined") return;

    const targetEvents: readonly EventType[] = events || DEFAULT_EVENTS;
    const refs = Array.isArray(ref) ? ref : [ref];

    const listener = (event: Event) => {
      const target = event.target as Node | null;

      if (!target) return;

      const clickedInside = refs.some((currentRef) => {
        return currentRef.current?.contains(target);
      });

      if (!clickedInside) {
        handlerRef.current(event);
      }
    };

    targetEvents.forEach((eventName) => document.addEventListener(eventName, listener));

    return () => {
      targetEvents.forEach((eventName) => document.removeEventListener(eventName, listener));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, eventsKey]);
}

export default useClickOutside;
