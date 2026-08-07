import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Configuration passed to `createIndexedDB()`.
 *
 * NOTE: this module manages a single global IndexedDB connection. Calling
 * `createIndexedDB()` more than once replaces the previous configuration
 * for any *future* connection attempts, but it will NOT reopen an
 * already-open connection with a different name/version. If you need more
 * than one database in the same app, namespace your stores within a single
 * database instead of calling `createIndexedDB()` multiple times.
 */
export interface IndexedDBConfig {
  /** Name of the IndexedDB database. */
  dbName: string;
  /** Schema version. Bump this whenever `stores` changes. */
  version?: number;
  /** Object store names to create (out-of-line keys, no keyPath). */
  stores: string[];
}

export type IndexedDBStatus = "idle" | "loading" | "ready" | "error";

export interface IndexedDBMeta {
  status: IndexedDBStatus;
  error: Error | null;
  /** Deletes the record from IndexedDB and resets local state to initialValue. */
  remove: () => Promise<void>;
}

type Updater<T> = T | ((prev: T) => T);

type SetValue<T> = (value: Updater<T>) => void;

// ---------------------------------------------------------------------------
// Module-level singleton connection manager
// ---------------------------------------------------------------------------

let registeredConfig: (IndexedDBConfig & { stores: string[] }) | null = null;
let dbConnectionPromise: Promise<IDBDatabase> | null = null;

/**
 * Registers the IndexedDB configuration used by all `useIndexedDB` calls.
 * Safe to call multiple times (e.g. in tests); the connection itself is
 * opened lazily and only once, the first time a hook actually needs it.
 *
 * @param {IndexedDBConfig} config The configuration object defining the database.
 * @param {string} config.dbName Name of the IndexedDB database.
 * @param {number} [config.version] Schema version. Bump this whenever `stores` changes.
 * @param {string[]} config.stores Object store names to create (out-of-line keys, no keyPath).
 */
export function createIndexedDB(config: IndexedDBConfig): void {
  registeredConfig = { ...config, stores: [...config.stores] };
  // Reset any previous connection attempt so a fresh config takes effect
  // the next time a database handle is requested.
  dbConnectionPromise = null;
}

/** Exposed for tests: fully resets the singleton connection manager. */
export function __resetIndexedDBForTests(): void {
  registeredConfig = null;
  dbConnectionPromise = null;
  broadcastChannel?.close();
  broadcastChannel = null;
  listeners.clear();
}

function getDatabase(): Promise<IDBDatabase> {
  if (dbConnectionPromise) return dbConnectionPromise;

  if (!registeredConfig) {
    return Promise.reject(
      new Error(
        "useIndexedDB: no database configured. Call createIndexedDB({ dbName, stores }) once before using useIndexedDB()."
      )
    );
  }

  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("useIndexedDB: IndexedDB is not available in this environment (e.g. during SSR).")
    );
  }

  const config = registeredConfig;

  dbConnectionPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(config.dbName, config.version ?? 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of config.stores) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("useIndexedDB: failed to open database."));
    request.onblocked = () =>
      reject(
        new Error("useIndexedDB: database open request is blocked by another open connection.")
      );
  }).catch((err) => {
    // Allow a later call to retry instead of permanently caching a rejection.
    dbConnectionPromise = null;
    throw err;
  });

  return dbConnectionPromise;
}

function assertStoreExists(storeName: string): void {
  if (registeredConfig && !registeredConfig.stores.includes(storeName)) {
    throw new Error(
      `useIndexedDB: store "${storeName}" was not registered in createIndexedDB({ stores: [...] }).`
    );
  }
}

function getRecord<T>(
  db: IDBDatabase,
  storeName: string,
  key: IDBValidKey
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error ?? new Error("useIndexedDB: read failed."));
  });
}

function putRecord<T>(
  db: IDBDatabase,
  storeName: string,
  key: IDBValidKey,
  value: T
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("useIndexedDB: write failed."));
    tx.onabort = () => reject(tx.error ?? new Error("useIndexedDB: write aborted."));
  });
}

function deleteRecord(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("useIndexedDB: delete failed."));
  });
}

// ---------------------------------------------------------------------------
// Same-tab pub/sub (so multiple components watching the same store/key stay
// in sync instantly, independent of the cross-tab BroadcastChannel below).
// ---------------------------------------------------------------------------

type LocalListener<T> = (value: T) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners = new Map<string, Set<LocalListener<any>>>();

function compositeKey(storeName: string, key: IDBValidKey): string {
  return `${storeName}::${String(key)}`;
}

function subscribeLocal<T>(ck: string, listener: LocalListener<T>): () => void {
  let set = listeners.get(ck);
  if (!set) {
    set = new Set();
    listeners.set(ck, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(ck);
  };
}

function publishLocal<T>(ck: string, value: T): void {
  listeners.get(ck)?.forEach((listener) => listener(value));
}

// ---------------------------------------------------------------------------
// Cross-tab sync via BroadcastChannel
// ---------------------------------------------------------------------------

const TAB_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`;

interface BroadcastMessage {
  type: "set" | "remove";
  storeName: string;
  key: IDBValidKey;
  value?: unknown;
  tabId: string;
}

let broadcastChannel: BroadcastChannel | null = null;
let broadcastChannelDbName: string | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const dbName = registeredConfig?.dbName ?? "useIndexedDB";

  if (broadcastChannel && broadcastChannelDbName === dbName) return broadcastChannel;

  broadcastChannel?.close();
  broadcastChannel = new BroadcastChannel(`useIndexedDB:${dbName}`);
  broadcastChannelDbName = dbName;

  broadcastChannel.addEventListener("message", (event: MessageEvent<BroadcastMessage>) => {
    const msg = event.data;
    if (!msg || msg.tabId === TAB_ID) return;
    const ck = compositeKey(msg.storeName, msg.key);
    if (msg.type === "set") {
      publishLocal(ck, msg.value);
    } else if (msg.type === "remove") {
      publishLocal(ck, REMOVED);
    }
  });

  return broadcastChannel;
}

function broadcast(message: BroadcastMessage): void {
  getBroadcastChannel()?.postMessage(message);
}

/** Sentinel distinguishing "value removed" from "value is undefined". */
const REMOVED = Symbol("useIndexedDB.removed");

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

interface InternalState<T> {
  status: IndexedDBStatus;
  value: T;
  error: Error | null;
}

/**
 * React hook for storing and retrieving a single value in IndexedDB.
 *
 * ```ts
 * const [theme, setTheme, meta] = useIndexedDB('settings', 'theme', 'light');
 * ```
 *
 * - `value` starts as `initialValue` and is replaced by the persisted
 *   value (if any) once the read from IndexedDB resolves.
 * - `setValue` accepts either a new value or an updater `(prev) => next`,
 *   mirroring `useState`. Writes are optimistic: local (and other
 *   same-tab) state updates immediately, the IndexedDB write happens
 *   asynchronously, and other tabs are notified once it succeeds.
 * - `meta.status` reflects the IndexedDB read lifecycle only ("idle" before
 *   the initial read has started, "loading" while it's in flight, "ready"
 *
 * @template T The type of the value being stored.
 * @param {string} storeName The name of the IndexedDB object store to use.
 * @param {IDBValidKey} key The key under which the value is stored.
 * @param {T | (() => T)} initialValue The initial value to use before the data is loaded from IndexedDB, or a function returning it.
 * @param {Object} [options] Optional configuration.
 * @param {boolean} [options.enabled=true] If false, pauses the hook from reading/writing to IndexedDB.
 * @returns {[T, (value: T | ((prev: T) => T)) => void, IndexedDBMeta]} A tuple containing the current value, a setter function, and a metadata object.
 */
export function useIndexedDB<T>(
  storeName: string,
  key: IDBValidKey,
  initialValue: T | (() => T),
  options?: { enabled?: boolean }
): [T, SetValue<T>, IndexedDBMeta] {
  const enabled = options?.enabled ?? true;

  const resolveInitial = useCallback((): T => {
    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  }, [initialValue]);

  const [state, setState] = useState<InternalState<T>>(() => ({
    status: "idle",
    value: resolveInitial(),
    error: null,
  }));

  // Kept in sync with the latest rendered value so setValue's updater
  // pattern doesn't need a stale closure or a functional setState (which
  // would risk double side-effects under React StrictMode's double-invoke).
  const valueRef = useRef(state.value);
  valueRef.current = state.value;

  const ck = compositeKey(storeName, key);

  // Initial load from IndexedDB.
  useEffect(() => {
    if (!enabled) return;

    try {
      assertStoreExists(storeName);
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: err as Error }));
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));

    getDatabase()
      .then((db) => getRecord<T>(db, storeName, key))
      .then((record) => {
        if (cancelled) return;
        if (record === undefined) {
          setState((s) => ({ ...s, status: "ready" }));
        } else {
          setState({ status: "ready", value: record, error: null });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          status: "error",
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeName, ck, enabled]);

  // Same-tab + cross-tab sync: react to updates from other hook instances.
  useEffect(() => {
    if (!enabled) return;

    return subscribeLocal<T | typeof REMOVED>(ck, (incoming) => {
      if (incoming === REMOVED) {
        setState({ status: "ready", value: resolveInitial(), error: null });
      } else {
        setState({ status: "ready", value: incoming as T, error: null });
      }
    });
  }, [ck, resolveInitial, enabled]);

  const setValue = useCallback<SetValue<T>>(
    (updater) => {
      if (!enabled) return;

      const nextValue =
        typeof updater === "function" ? (updater as (prev: T) => T)(valueRef.current) : updater;

      // Optimistic local + same-tab update.
      setState({ status: "ready", value: nextValue, error: null });
      valueRef.current = nextValue;
      publishLocal(ck, nextValue);

      getDatabase()
        .then((db) => putRecord(db, storeName, key, nextValue))
        .then(() => broadcast({ type: "set", storeName, key, value: nextValue, tabId: TAB_ID }))
        .catch((err: unknown) => {
          setState((s) => ({
            ...s,
            status: "error",
            error: err instanceof Error ? err : new Error(String(err)),
          }));
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeName, ck, enabled]
  );

  const remove = useCallback(async () => {
    if (!enabled) return;

    const db = await getDatabase();
    await deleteRecord(db, storeName, key);
    const fallback = resolveInitial();
    setState({ status: "ready", value: fallback, error: null });
    valueRef.current = fallback;
    publishLocal(ck, REMOVED);
    broadcast({ type: "remove", storeName, key, tabId: TAB_ID });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeName, ck, resolveInitial, enabled]);

  const effectiveStatus = enabled ? state.status : "idle";
  const effectiveError = enabled ? state.error : null;
  const effectiveValue = enabled ? state.value : resolveInitial();

  const meta = useMemo<IndexedDBMeta>(
    () => ({ status: effectiveStatus, error: effectiveError, remove }),
    [effectiveStatus, effectiveError, remove]
  );

  return [effectiveValue, setValue, meta];
}
