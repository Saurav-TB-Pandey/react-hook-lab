import { RefObject } from "react";
import { useResizeObserver } from "./useResizeObserver";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Tracks the width and height of an HTML element in real-time.
 * Uses `ResizeObserver` under the hood.
 *
 * @param ref - The React ref attached to the element you want to measure.
 * @returns Object containing the exact `width` and `height` in pixels.
 *
 * @example
 * ```tsx
 * const ref = useRef(null);
 * const { width, height } = useElementSize(ref);
 * return <div ref={ref}>Size: {width} x {height}</div>;
 * ```
 */
export function useElementSize<T extends HTMLElement>(ref: RefObject<T>): ElementSize {
  const { width, height } = useResizeObserver(ref);

  return {
    width,
    height,
  };
}
