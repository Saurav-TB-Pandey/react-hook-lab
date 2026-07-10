import { RefObject } from "react";
type EventType = "mousedown" | "mouseup" | "touchstart" | "touchend" | "pointerdown" | "pointerup" | "click";
export interface UseClickOutsideOptions {
    enabled?: boolean;
    events?: EventType[];
}
export declare function useClickOutside<T extends HTMLElement>(ref: RefObject<T> | RefObject<T>[], handler: (event: Event) => void, options?: UseClickOutsideOptions): void;
export {};
