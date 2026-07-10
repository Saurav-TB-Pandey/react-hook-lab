"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResizeObserver = useResizeObserver;
const react_1 = require("react");
function useResizeObserver(ref, options = {}) {
    const { box = "content-box" } = options;
    const [entry, setEntry] = (0, react_1.useState)();
    const [size, setSize] = (0, react_1.useState)({
        width: 0,
        height: 0,
    });
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        if (!("ResizeObserver" in window))
            return;
        const element = ref.current;
        if (!element)
            return;
        const observer = new ResizeObserver(([observerEntry]) => {
            const { width, height } = observerEntry.contentRect;
            setEntry(observerEntry);
            setSize((prev) => {
                if (prev.width === width &&
                    prev.height === height) {
                    return prev;
                }
                return {
                    width,
                    height,
                };
            });
        });
        observer.observe(element, { box });
        return () => {
            observer.disconnect();
        };
    }, [ref, box]);
    return {
        width: size.width,
        height: size.height,
        size,
        entry,
    };
}
