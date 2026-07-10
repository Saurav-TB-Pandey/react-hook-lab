import { RefObject } from "react";
export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
    freezeOnceVisible?: boolean;
}
export interface UseIntersectionObserverReturn {
    isIntersecting: boolean;
    entry?: IntersectionObserverEntry;
}
export declare function useIntersectionObserver<T extends HTMLElement>(ref: RefObject<T>, options?: UseIntersectionObserverOptions): UseIntersectionObserverReturn;
