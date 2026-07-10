"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToggle = useToggle;
const react_1 = require("react");
function useToggle(defaultValue, reverseValue) {
    const [value, setValue] = (0, react_1.useState)(defaultValue);
    const toggle = (0, react_1.useCallback)(() => {
        if (reverseValue !== undefined) {
            setValue((prev) => prev === defaultValue ? reverseValue : defaultValue);
        }
        else {
            setValue((prev) => !prev);
        }
    }, [defaultValue, reverseValue]);
    return {
        value,
        setValue: setValue,
        toggle,
    };
}
