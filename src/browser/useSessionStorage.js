"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionStorage = useSessionStorage;
const react_1 = require("react");
function useSessionStorage(key, initialValue) {
    const readValue = () => {
        if (typeof window === "undefined")
            return initialValue;
        try {
            const item = sessionStorage.getItem(key);
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
        sessionStorage.setItem(key, JSON.stringify(newValue));
    };
    (0, react_1.useEffect)(() => {
        setValue(readValue());
    }, [key]);
    return [value, setStoredValue];
}
