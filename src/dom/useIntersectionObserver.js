"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIntersectionObserver = useIntersectionObserver;
const react_1 = require("react");
function useIntersectionObserver(ref, options = {}) {
    const { threshold = 0, root = null, rootMargin = "0px", freezeOnceVisible = false, } = options;
    const [entry, setEntry] = (0, react_1.useState)();
    const frozen = freezeOnceVisible && (entry === null || entry === void 0 ? void 0 : entry.isIntersecting);
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        if (!("IntersectionObserver" in window))
            return;
        const element = ref.current;
        if (!element || frozen)
            return;
        const observer = new IntersectionObserver(([observerEntry]) => {
            setEntry(observerEntry);
        }, {
            threshold,
            root,
            rootMargin,
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [
        ref,
        threshold,
        root,
        rootMargin,
        frozen,
    ]);
    return {
        isIntersecting: !!(entry === null || entry === void 0 ? void 0 : entry.isIntersecting),
        entry,
    };
}
