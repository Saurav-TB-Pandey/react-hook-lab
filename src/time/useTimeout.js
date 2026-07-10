"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTimeout = useTimeout;
const react_1 = require("react");
function useTimeout(callback, delay) {
    const timeoutRef = (0, react_1.useRef)();
    const callbackRef = (0, react_1.useRef)(callback);
    (0, react_1.useEffect)(() => {
        callbackRef.current = callback;
    }, [callback]);
    const clear = (0, react_1.useCallback)(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    }, []);
    const start = (0, react_1.useCallback)(() => {
        clear();
        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = undefined;
            callbackRef.current();
        }, delay);
    }, [delay, clear]);
    const restart = (0, react_1.useCallback)(() => {
        start();
    }, [start]);
    const isActive = (0, react_1.useCallback)(() => {
        return timeoutRef.current !== undefined;
    }, []);
    (0, react_1.useEffect)(() => {
        start();
        return clear;
    }, [start, clear]);
    return {
        start,
        clear,
        restart,
        isActive,
    };
}
