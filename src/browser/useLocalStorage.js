"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocalStorage = useLocalStorage;
const react_1 = require("react");
function useLocalStorage(key, initialValue) {
    const readValue = () => {
        if (typeof window === "undefined")
            return initialValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        }
        catch {
            return initialValue;
        }
    };
    const [value, setValue] = (0, react_1.useState)(readValue);
    const setStoredValue = (newValue) => {
        setValue(newValue);
        if (typeof window === "undefined")
            return;
        localStorage.setItem(key, JSON.stringify(newValue));
    };
    (0, react_1.useEffect)(() => {
        setValue(readValue());
    }, [key]);
    return [value, setStoredValue];
}
