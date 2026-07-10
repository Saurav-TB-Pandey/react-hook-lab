import { DependencyList } from "react";
export interface UseAsyncOptions<T> {
    immediate?: boolean;
    initialData?: T;
}
export interface UseAsyncReturn<T> {
    data: T | undefined;
    error: Error | null;
    loading: boolean;
    execute: () => Promise<T | undefined>;
    retry: () => Promise<T | undefined>;
    reset: () => void;
}
export declare function useAsync<T>(asyncFunction: () => Promise<T>, dependencies?: DependencyList, options?: UseAsyncOptions<T>): UseAsyncReturn<T>;
