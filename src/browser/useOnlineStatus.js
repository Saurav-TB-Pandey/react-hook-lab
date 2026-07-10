"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOnlineStatus = void 0;
const react_1 = require("react");
const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = (0, react_1.useState)(typeof navigator === "undefined"
        ? true
        : navigator.onLine);
    (0, react_1.useEffect)(() => {
        if (typeof window === "undefined")
            return;
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);
    return isOnline;
};
exports.useOnlineStatus = useOnlineStatus;
