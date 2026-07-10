import { RefObject } from "react";
export interface ElementSize {
    width: number;
    height: number;
}
export declare function useElementSize<T extends HTMLElement>(ref: RefObject<T>): ElementSize;
