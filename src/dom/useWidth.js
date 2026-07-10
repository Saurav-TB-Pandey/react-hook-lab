"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWidth = useWidth;
const react_1 = require("react");
function useWidth() {
    const getWindowWidth = () => typeof window === "undefined" ? 0 : window.innerWidth;
    const [width, setWidth] = (0, react_1.useState)(getWindowWidth);
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        let timeoutId;
        const handleResize = () => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                setWidth(getWindowWidth());
            }, 150);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            window.clearTimeout(timeoutId);
        };
    }, []);
    return width;
}
