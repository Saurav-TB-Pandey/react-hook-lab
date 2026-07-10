import { RefObject } from "react";
import { useResizeObserver } from "./useResizeObserver";

export interface ElementSize {
  width: number;
  height: number;
}

export function useElementSize<T extends HTMLElement>(
  ref: RefObject<T>
): ElementSize {
  const { width, height } = useResizeObserver(ref);

  return {
    width,
    height,
  };
}