import type { SharedListener, Unsubscribe } from "../types";

/**
 * Keyed event bus for external store subscriptions.
 */
export class EventBus {
  private readonly listeners = new Map<string, Set<SharedListener>>();

  /**
   * Subscribes a listener to a specific state key.
   */
  subscribe(key: string, listener: SharedListener): Unsubscribe {
    const listenersForKey = this.listeners.get(key) ?? new Set<SharedListener>();
    listenersForKey.add(listener);
    this.listeners.set(key, listenersForKey);

    return () => {
      listenersForKey.delete(listener);

      if (listenersForKey.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Emits a change notification for one key.
   */
  emit(key: string): void {
    const listenersForKey = this.listeners.get(key);
    if (!listenersForKey) return;

    listenersForKey.forEach((listener) => {
      listener();
    });
  }
}
