export interface UseThrottleOptions {
    /**
     * Invoke immediately on the first call.
     * Default: true
     */
    leading?: boolean;
    /**
     * Invoke once more after the delay
     * with the latest value.
     * Default: true
     */
    trailing?: boolean;
}
/**
 * Returns a throttled value.
 *
 * @example
 * const throttledSearch = useThrottle(search, 500);
 */
export declare function useThrottle<T>(value: T, delay?: number, options?: UseThrottleOptions): T;
