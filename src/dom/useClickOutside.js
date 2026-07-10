"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useClickOutside = useClickOutside;
const react_1 = require("react");
function useClickOutside(ref, handler, options = {}) {
    const { enabled = true, events = ["mousedown", "touchstart"], } = options;
    (0, react_1.useEffect)(() => {
        if (!enabled)
            return;
        if (typeof document === "undefined")
            return;
        const refs = Array.isArray(ref) ? ref : [ref];
        const listener = (event) => {
            const target = event.target;
            if (!target)
                return;
            const clickedInside = refs.some((currentRef) => {
                var _a;
                return (_a = currentRef.current) === null || _a === void 0 ? void 0 : _a.contains(target);
            });
            if (!clickedInside) {
                handler(event);
            }
        };
        events.forEach((eventName) => document.addEventListener(eventName, listener));
        return () => {
            events.forEach((eventName) => document.removeEventListener(eventName, listener));
        };
    }, [ref, handler, enabled, events]);
}
