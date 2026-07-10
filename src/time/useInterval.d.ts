export interface UseIntervalReturn {
    start: () => void;
    stop: () => void;
    restart: () => void;
    isRunning: () => boolean;
}
export declare function useInterval(callback: () => void, delay: number): UseIntervalReturn;
