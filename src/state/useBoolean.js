"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBoolean = useBoolean;
const react_1 = require("react");
function useBoolean(initialValue = false) {
    const [value, setValue] = (0, react_1.useState)(initialValue);
    const setTrue = (0, react_1.useCallback)(() => {
        setValue(true);
    }, []);
    const setFalse = (0, react_1.useCallback)(() => {
        setValue(false);
    }, []);
    const toggle = (0, react_1.useCallback)(() => {
        setValue((prev) => !prev);
    }, []);
    return {
        value,
        setValue,
        setTrue,
        setFalse,
        toggle,
    };
}
