"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThrottle = useThrottle;
const react_1 = require("react");
/**
 * Returns a throttled value.
 *
 * @example
 * const throttledSearch = useThrottle(search, 500);
 */
function useThrottle(value, delay = 300, options = {}) {
    const { leading = true, trailing = true, } = options;
    const [throttledValue, setThrottledValue] = (0, react_1.useState)(value);
    const lastExecuted = (0, react_1.useRef)(0);
    const timeoutRef = (0, react_1.useRef)(null);
    const latestValue = (0, react_1.useRef)(value);
    (0, react_1.useEffect)(() => {
        latestValue.current = value;
        const now = Date.now();
        const remaining = delay - (now - lastExecuted.current);
        // First execution
        if (lastExecuted.current === 0 && leading) {
            lastExecuted.current = now;
            setThrottledValue(value);
            return;
        }
        // Enough time has passed
        if (remaining <= 0) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            lastExecuted.current = now;
            setThrottledValue(value);
            return;
        }
        // Schedule trailing execution
        if (trailing && !timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
                lastExecuted.current = Date.now();
                timeoutRef.current = null;
                setThrottledValue(latestValue.current);
            }, remaining);
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [value, delay, leading, trailing]);
    return throttledValue;
}
