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
  initialValue: SharedStateInitialValue<T>
): [T, SharedStateSetter<T>] {
  const initialValueRef = useRef<InitialValueRef<T>>({ key, initialValue });

  if (initialValueRef.current.key !== key) {
    initialValueRef.current = { key, initialValue };
  }

  useEffect(() => {
    sharedEngine.initializeKey(key, initialValueRef.current.initialValue);
  }, [key]);

  const subscribe = useCallback(
    (listener: () => void) => snapshotManager.subscribe(key, listener),
    [key]
  );

  const getSnapshot = useCallback(
    () => snapshotManager.getSnapshot(key, initialValueRef.current.initialValue),
    [key]
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setState = useCallback(
    (action: SharedStateAction<T>) => {
      sharedEngine.setState(key, action, initialValueRef.current.initialValue);
    },
    [key]
  );

  return [state, setState];
}
