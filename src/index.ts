export * from "./async";
export * from "./browser";
export * from "./dom";
export * from "./state";
export * from "./time";
export * from "./debug";

import { useAsync, useAsyncDebounce, useDebounce, useThrottle } from "./async";
import {
  useClipboard,
  useDownload,
  useLocalStorage,
  useNotifications,
  useOnlineStatus,
  useSessionStorage,
  useCamera,
  useMicrophone,
  useLocation,
  useURL,
  useFullscreen,
} from "./browser";
import {
  useClickOutside,
  useElementSize,
  useIntersectionObserver,
  useResizeObserver,
  useWidth,
  useIdle,
} from "./dom";
import {
  useBoolean,
  useCounter,
  usePrevious,
  useSharedState,
  useToggle,
  useDeepClone,
  useDeepMemo,
} from "./state";
import { useInterval, useTimeout, useTimezone } from "./time";
import { useRenderReason } from "./debug";

export default {
  useAsync,
  useAsyncDebounce,
  useDebounce,
  useThrottle,
  useClipboard,
  useDownload,
  useLocalStorage,
  useNotifications,
  useOnlineStatus,
  useSessionStorage,
  useClickOutside,
  useElementSize,
  useIntersectionObserver,
  useResizeObserver,
  useWidth,
  useBoolean,
  useCounter,
  usePrevious,
  useToggle,
  useSharedState,
  useDeepClone,
  useDeepMemo,
  useInterval,
  useTimeout,
  useRenderReason,
  useCamera,
  useMicrophone,
  useLocation,
  useIdle,
  useTimezone,
  useURL,
  useFullscreen,
};
