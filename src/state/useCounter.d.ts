export interface UseCounterOptions {
    min?: number;
    max?: number;
    step?: number;
}
export interface UseCounterReturn {
    count: number;
    set: (value: number) => void;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
}
export declare function useCounter(initialValue?: number, options?: UseCounterOptions): UseCounterReturn;
