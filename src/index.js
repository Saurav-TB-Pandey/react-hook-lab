"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./async"), exports);
__exportStar(require("./browser"), exports);
__exportStar(require("./dom"), exports);
__exportStar(require("./state"), exports);
__exportStar(require("./time"), exports);
const async_1 = require("./async");
const browser_1 = require("./browser");
const dom_1 = require("./dom");
const state_1 = require("./state");
const time_1 = require("./time");
exports.default = {
    useAsync: async_1.useAsync,
    useAsyncDebounce: async_1.useAsyncDebounce,
    useDebounce: async_1.useDebounce,
    useThrottle: async_1.useThrottle,
    useClipboard: browser_1.useClipboard,
    useLocalStorage: browser_1.useLocalStorage,
    useOnlineStatus: browser_1.useOnlineStatus,
    useSessionStorage: browser_1.useSessionStorage,
    useClickOutside: dom_1.useClickOutside,
    useElementSize: dom_1.useElementSize,
    useIntersectionObserver: dom_1.useIntersectionObserver,
    useResizeObserver: dom_1.useResizeObserver,
    useWidth: dom_1.useWidth,
    useBoolean: state_1.useBoolean,
    useCounter: state_1.useCounter,
    usePrevious: state_1.usePrevious,
    useToggle: state_1.useToggle,
    useInterval: time_1.useInterval,
    useTimeout: time_1.useTimeout,
};
