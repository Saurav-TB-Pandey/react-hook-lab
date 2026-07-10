"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useElementSize = useElementSize;
const useResizeObserver_1 = require("./useResizeObserver");
function useElementSize(ref) {
    const { width, height } = (0, useResizeObserver_1.useResizeObserver)(ref);
    return {
        width,
        height,
    };
}
