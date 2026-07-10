"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useClipboard = void 0;
const react_1 = require("react");
const useClipboard = (timeout = 2000) => {
    const [{ copied, error }, setState] = (0, react_1.useState)({
        copied: false,
        error: null,
    });
    const copy = (0, react_1.useCallback)(async (text) => {
        if (typeof navigator === "undefined" ||
            !navigator.clipboard) {
            setState({
                copied: false,
                error: new Error("Clipboard API is not supported."),
            });
            return false;
        }
        try {
            await navigator.clipboard.writeText(text);
            setState({
                copied: true,
                error: null,
            });
            setTimeout(() => {
                setState({
                    copied: false,
                    error: null,
                });
            }, timeout);
            return true;
        }
        catch (err) {
            setState({
                copied: false,
                error: err,
            });
            return false;
        }
    }, [timeout]);
    return {
        copied,
        error,
        copy,
    };
};
exports.useClipboard = useClipboard;
