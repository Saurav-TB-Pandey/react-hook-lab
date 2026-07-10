"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInterval = useInterval;
const react_1 = require("react");
function useInterval(callback, delay) {
    const intervalRef = (0, react_1.useRef)();
    const callbackRef = (0, react_1.useRef)(callback);
    (0, react_1.useEffect)(() => {
        callbackRef.current = callback;
    }, [callback]);
    const stop = (0, react_1.useCallback)(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
        }
    }, []);
    const start = (0, react_1.useCallback)(() => {
        stop();
        intervalRef.current = setInterval(() => {
            callbackRef.current();
        }, delay);
    }, [delay, stop]);
    const restart = (0, react_1.useCallback)(() => {
        start();
    }, [start]);
    const isRunning = (0, react_1.useCallback)(() => {
        return intervalRef.current !== undefined;
    }, []);
    (0, react_1.useEffect)(() => {
        start();
        return stop;
    }, [start, stop]);
    return {
        start,
        stop,
        restart,
        isRunning,
    };
}
