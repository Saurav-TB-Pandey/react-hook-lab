/**
 * A React-compatible state setter action.
 */
export type SharedStateAction<T> = T | ((previous: T) => T);

/**
 * A React-compatible lazy initial state value.
 */
export type SharedStateInitialValue<T> = T | (() => T);

/**
 * A React-compatible shared state setter.
 */
export type SharedStateSetter<T> = (value: SharedStateAction<T>) => void;

/**
 * A value stored for a shared state key.
 */
export interface SharedEntry<T> {
  value: T;
  version: number;
  tabId: string;
  updatedAt: number;
}

/**
 * Metadata required for deterministic conflict resolution.
 */
export interface SharedEntryMeta {
  version: number;
  tabId: string;
  updatedAt: number;
}

/**
 * Listener used by the external store event bus.
 */
export type SharedListener = () => void;

/**
 * Cleanup callback returned by subscriptions.
 */
export type Unsubscribe = () => void;
