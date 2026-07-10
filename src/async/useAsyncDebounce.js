"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAsyncDebounce = useAsyncDebounce;
const react_1 = require("react");
function useAsyncDebounce(callback, delay = 300) {
    const [result, setResult] = (0, react_1.useState)(undefined);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(undefined);
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        const timerId = setTimeout(() => {
            setLoading(true);
            setError(undefined);
            Promise.resolve(callback())
                .then((value) => {
                if (!cancelled) {
                    setResult(value);
                }
            })
                .catch((err) => {
                if (!cancelled) {
                    setError(err);
                }
            })
                .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        }, delay);
        return () => {
            cancelled = true;
            clearTimeout(timerId);
        };
    }, [callback, delay]);
    return { result, loading, error };
}
