"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAsync = useAsync;
const react_1 = require("react");
function useAsync(asyncFunction, dependencies = [], options = {}) {
    const { immediate = true, initialData, } = options;
    const [data, setData] = (0, react_1.useState)(initialData);
    const [loading, setLoading] = (0, react_1.useState)(immediate);
    const [error, setError] = (0, react_1.useState)(null);
    // Prevent stale responses
    const requestId = (0, react_1.useRef)(0);
    const execute = (0, react_1.useCallback)(async () => {
        const id = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const result = await asyncFunction();
            // Ignore stale response
            if (id !== requestId.current) {
                return;
            }
            setData(result);
            return result;
        }
        catch (err) {
            if (id !== requestId.current) {
                return;
            }
            setError(err);
        }
        finally {
            if (id === requestId.current) {
                setLoading(false);
            }
        }
    }, [asyncFunction]);
    const retry = (0, react_1.useCallback)(() => execute(), [execute]);
    const reset = (0, react_1.useCallback)(() => {
        setLoading(false);
        setError(null);
        setData(initialData);
    }, [initialData]);
    (0, react_1.useEffect)(() => {
        if (immediate) {
            execute();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
    return {
        data,
        error,
        loading,
        execute,
        retry,
        reset,
    };
}
