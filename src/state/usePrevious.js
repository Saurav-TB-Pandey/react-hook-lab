"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePrevious = usePrevious;
const react_1 = require("react");
function usePrevious(value, defaultValue) {
    const ref = (0, react_1.useRef)(defaultValue);
    (0, react_1.useEffect)(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}
