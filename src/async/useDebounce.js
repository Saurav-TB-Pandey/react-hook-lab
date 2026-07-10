"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebounce = useDebounce;
const react_1 = require("react");
function useDebounce(value, delay = 300, options = {}) {
    const { initialValue = value, leading = false, } = options;
    const [debouncedValue, setDebouncedValue] = (0, react_1.useState)(initialValue);
    const isFirstRender = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(() => {
        if (leading && isFirstRender.current) {
            isFirstRender.current = false;
            setDebouncedValue(value);
            return;
        }
        const timeout = setTimeout(() => {
            const nextValue = typeof value === "string"
                ? value.trim()
                : value;
            setDebouncedValue(nextValue);
        }, delay);
        return () => clearTimeout(timeout);
    }, [value, delay, leading]);
    return debouncedValue;
}
