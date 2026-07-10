export interface UseDebounceOptions<T> {
    initialValue?: T;
    leading?: boolean;
}
export declare function useDebounce<T>(value: T, delay?: number, options?: UseDebounceOptions<T>): T;
