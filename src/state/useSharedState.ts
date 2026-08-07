import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { sharedEngine } from "./shared/engine/SharedEngine";
import { snapshotManager } from "./shared/engine/SnapshotManager";
import type { SharedStateAction, SharedStateInitialValue, SharedStateSetter } from "./shared/types";

type InitialValueRef<T> = {
  key: string;
  initialValue: SharedStateInitialValue<T>;
};

/**
 * Global state manager that syncs seamlessly across components AND browser tabs.
 * Uses `BroadcastChannel` under the hood. Perfect for things like global themes or user settings.
 *
 * @param key - The unique identifier for this piece of shared state.
 * @param initialValue - The default value.
 * @param options - Optional configuration.
 * @param options.enabled - If false, pauses the hook from subscribing and broadcasting.
 * @returns State and updater function, identical to `useState`.
 *
 * @example
 * ```tsx
 * // Component A (Maybe in a completely different browser tab!)
 * const [theme, setTheme] = useSharedState("global-theme", "light");
 * ```
 */
export function useSharedState<T>(
  key: string,
  initialValue: SharedStateInitialValue<T>,
  options?: { enabled?: boolean }
): [T, SharedStateSetter<T>] {
  const enabled = options?.enabled ?? true;

  const initialValueRef = useRef<InitialValueRef<T>>({ key, initialValue });

  if (initialValueRef.current.key !== key) {
    initialValueRef.current = { key, initialValue };
  }

  useEffect(() => {
    if (!enabled) return;
    sharedEngine.initializeKey(key, initialValueRef.current.initialValue);
  }, [key, enabled]);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!enabled) return () => {};
      return snapshotManager.subscribe(key, listener);
    },
    [key, enabled]
  );

  const getSnapshot = useCallback(() => {
    if (!enabled) {
      return typeof initialValueRef.current.initialValue === "function"
        ? (initialValueRef.current.initialValue as () => T)()
        : initialValueRef.current.initialValue;
    }
    return snapshotManager.getSnapshot(key, initialValueRef.current.initialValue);
  }, [key, enabled]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setState = useCallback(
    (action: SharedStateAction<T>) => {
      if (!enabled) return;
      sharedEngine.setState(key, action, initialValueRef.current.initialValue);
    },
    [key, enabled]
  );

  return [state, setState];
}
