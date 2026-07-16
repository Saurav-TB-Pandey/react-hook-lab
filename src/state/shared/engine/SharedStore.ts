import type {
  SharedEntry,
  SharedEntryMeta,
  SharedStateAction,
  SharedStateInitialValue,
} from "../types";

/**
 * In-memory store for all shared state entries.
 */
export class SharedStore {
  private readonly entries = new Map<string, SharedEntry<unknown>>();

  /**
   * Returns true when a key exists in the store.
   */
  has(key: string): boolean {
    return this.entries.has(key);
  }

  /**
   * Gets an entry for a key.
   */
  getEntry<T>(key: string): SharedEntry<T> | undefined {
    return this.entries.get(key) as SharedEntry<T> | undefined;
  }

  /**
   * Ensures a key has an initial entry and returns it.
   */
  ensureEntry<T>(
    key: string,
    initialValue: SharedStateInitialValue<T>,
    tabId: string
  ): SharedEntry<T> {
    const existing = this.getEntry<T>(key);
    if (existing) return existing;

    const entry: SharedEntry<T> = {
      value: resolveInitialValue(initialValue),
      version: 1,
      tabId,
      updatedAt: Date.now(),
    };

    this.entries.set(key, entry);
    return entry;
  }

  /**
   * Applies a local state action.
   */
  setLocalValue<T>(
    key: string,
    action: SharedStateAction<T>,
    initialValue: SharedStateInitialValue<T>,
    tabId: string
  ): SharedEntry<T> | null {
    const current = this.ensureEntry(key, initialValue, tabId);
    const nextValue = resolveAction(action, current.value);

    if (Object.is(nextValue, current.value)) {
      return null;
    }

    const nextEntry: SharedEntry<T> = {
      value: nextValue,
      version: current.version + 1,
      tabId,
      updatedAt: Date.now(),
    };

    this.entries.set(key, nextEntry);
    return nextEntry;
  }

  /**
   * Applies an incoming remote entry if it wins conflict resolution.
   */
  applyRemoteEntry<T>(key: string, incoming: SharedEntry<T>): boolean {
    const local = this.getEntry<T>(key);

    if (local && !shouldAcceptIncoming(incoming, local)) {
      return false;
    }

    this.entries.set(key, incoming);
    return true;
  }

  /**
   * Deletes a key if the incoming delete wins conflict resolution.
   */
  applyRemoteDelete(key: string, incoming: SharedEntryMeta): boolean {
    const local = this.getEntry<unknown>(key);

    if (!local) {
      return false;
    }

    if (!shouldAcceptIncoming(incoming, local)) {
      return false;
    }

    this.entries.delete(key);
    return true;
  }
}

function resolveInitialValue<T>(initialValue: SharedStateInitialValue<T>): T {
  return typeof initialValue === "function"
    ? (initialValue as () => T)()
    : initialValue;
}

function resolveAction<T>(action: SharedStateAction<T>, previous: T): T {
  return typeof action === "function"
    ? (action as (previousValue: T) => T)(previous)
    : action;
}

function shouldAcceptIncoming(
  incoming: SharedEntryMeta,
  local: SharedEntryMeta
): boolean {
  if (incoming.version > local.version) return true;
  if (incoming.version < local.version) return false;

  return incoming.tabId > local.tabId;
}
