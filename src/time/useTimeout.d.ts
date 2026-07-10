export interface UseTimeoutReturn {
    start: () => void;
    clear: () => void;
    restart: () => void;
    isActive: () => boolean;
}
export declare function useTimeout(callback: () => void, delay: number): UseTimeoutReturn;
