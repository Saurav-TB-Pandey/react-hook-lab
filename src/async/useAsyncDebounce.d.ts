export interface UseAsyncDebounceReturn<T> {
    result: T | undefined;
    loading: boolean;
    error: unknown;
}
export declare function useAsyncDebounce<T>(callback: () => T | Promise<T>, delay?: number): UseAsyncDebounceReturn<T>;
