import { RefObject } from "react";
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
export declare function useResizeObserver<T extends HTMLElement>(ref: RefObject<T>, options?: UseResizeObserverOptions): UseResizeObserverReturn;
