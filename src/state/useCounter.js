"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCounter = useCounter;
const react_1 = require("react");
function useCounter(initialValue = 0, options = {}) {
    const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, step = 1, } = options;
    const [count, setCount] = (0, react_1.useState)(initialValue);
    const clamp = (0, react_1.useCallback)((value) => Math.min(max, Math.max(min, value)), [min, max]);
    const set = (0, react_1.useCallback)((value) => {
        setCount(clamp(value));
    }, [clamp]);
    const increment = (0, react_1.useCallback)(() => {
        setCount((prev) => clamp(prev + step));
    }, [step, clamp]);
    const decrement = (0, react_1.useCallback)(() => {
        setCount((prev) => clamp(prev - step));
    }, [step, clamp]);
    const reset = (0, react_1.useCallback)(() => {
        setCount(initialValue);
    }, [initialValue]);
    return {
        count,
        set,
        increment,
        decrement,
        reset,
    };
}
