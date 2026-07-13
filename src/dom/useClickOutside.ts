import { RefObject, useEffect } from "react";

type EventType =
  "mousedown" | "mouseup" | "touchstart" | "touchend" | "pointerdown" | "pointerup" | "click";

export interface UseClickOutsideOptions {
  enabled?: boolean;
  events?: EventType[];
}

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
