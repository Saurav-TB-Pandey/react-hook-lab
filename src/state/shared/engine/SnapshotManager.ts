import { sharedEngine } from "./SharedEngine";
import type { SharedListener, SharedStateInitialValue, Unsubscribe } from "../types";

/**
 * External-store snapshot adapter for shared state keys.
 */
export class SnapshotManager {
  /**
   * Gets the current snapshot for a key.
   */
  getSnapshot<T>(key: string, initialValue: SharedStateInitialValue<T>): T {
    return sharedEngine.getSnapshot(key, initialValue);
  }

  /**
   * Subscribes to snapshot changes for a key.
   */
  subscribe(key: string, listener: SharedListener): Unsubscribe {
    return sharedEngine.subscribe(key, listener);
  }
}

/**
 * Singleton snapshot manager for hooks.
 */
export const snapshotManager = new SnapshotManager();
