import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useSharedState } from "../state/useSharedState";
import { useIndexedDB } from "../browser/useIndexedDB";
import { deepEqual } from "../utils/deepEqual";
import { deepClone } from "../utils/deepClone";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration options for the `useResource` hook.
 *
 * @template T The type of data returned by the fetcher.
 */
export interface ResourceConfig<T> {
  key: string;
  fetcher: (signal: AbortSignal) => Promise<T>;

  enabled?: boolean;
  initialData?: T | (() => T);
  cache?: "memory" | "shared" | "indexeddb" | false;
  namespace?: string;
  persist?: {
    exclude?: (keyof T)[];
    store?: string;
  };

  staleTime?: number;
  gcTime?: number;

  retry?: number | ((error: unknown, attempt: number) => boolean);
  retryDelay?: number | ((attempt: number) => number);

  keepPreviousData?: boolean;

  refetchOnFocus?: boolean;
  refetchOnReconnect?: boolean;

  selector?: (data: T | undefined) => unknown;
  equalityFn?: (a: unknown, b: unknown) => boolean;

  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onMutate?: (patch: unknown) => void;
  onRefresh?: () => void;
  onInvalidate?: () => void;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface ResourceState<T> {
  data: T | undefined;
  error: Error | undefined;
  status: "idle" | "loading" | "success" | "refreshing" | "error";
  updatedAt: number | null;
  createdAt: number | null;
  retryCount: number;
}

/**
 * The state and methods returned by the `useResource` hook.
 *
 * @template T The type of data managed by the resource.
 */
export interface Resource<T> extends ResourceState<T> {
  loading: boolean;
  fetching: boolean;
  isStale: boolean;

  refresh(): Promise<void>;
  invalidate(): void;
  reset(): void;
  set(value: T): void;
  mutate(updater: (current: T | undefined) => T): void;
  select<R>(selector: (data: T | undefined) => R, equalityFn?: (a: R, b: R) => boolean): R;

  /** @internal */
  __key: string;
}

type ConfigRef<T> = Omit<ResourceConfig<T>, "key" | "namespace" | "cache" | "staleTime" | "gcTime">;

type Subscription<T> = {
  listener: (nextState: ResourceState<T>, prevState: ResourceState<T>) => void;
  getConfig: () => ConfigRef<T>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

let registryMaxEntries = 200;

export function configureResourceRegistry(options: { maxEntries?: number }) {
  if (options.maxEntries !== undefined) registryMaxEntries = options.maxEntries;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, ResourceController<any>>();

function evictIfNecessary() {
  if (registry.size <= registryMaxEntries) return;

  // Evict LRU zero-subscriber entries
  for (const [key, ctrl] of registry.entries()) {
    if (ctrl.subscriberCount === 0) {
      if (ctrl.gcTimer) clearTimeout(ctrl.gcTimer);
      if (ctrl.abortController) ctrl.abortController.abort();
      registry.delete(key);
      if (registry.size <= registryMaxEntries) break;
    }
  }
}

function getOrCreateController<T>(
  compositeKey: string,
  initialData?: T | (() => T)
): ResourceController<T> {
  if (!registry.has(compositeKey)) {
    registry.set(compositeKey, new ResourceController<T>(compositeKey, initialData));
    evictIfNecessary();
  }
  return registry.get(compositeKey) as ResourceController<T>;
}

export function __resetResourceRegistryForTests() {
  for (const ctrl of registry.values()) {
    if (ctrl.gcTimer) clearTimeout(ctrl.gcTimer);
    if (ctrl.abortController) ctrl.abortController.abort();
  }
  registry.clear();
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

function normalizeError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

class ResourceController<T> {
  key: string;
  state: ResourceState<T>;
  subscribers = new Set<Subscription<T>>();
  subscriberCount = 0;
  generation = 0;
  pendingMutations: Array<(current: T) => T> = [];
  gcTimer: ReturnType<typeof setTimeout> | null = null;
  abortController: AbortController | null = null;

  // Handlers registered by sub-controllers
  cacheWriter?: (value: T) => void;
  cacheClearer?: () => void;
  cacheExcludes?: (keyof T)[];
  devFetcherString?: string;

  constructor(key: string, initialData?: T | (() => T)) {
    this.key = key;
    const resolvedInitial =
      typeof initialData === "function" ? (initialData as () => T)() : initialData;
    this.state = {
      data: resolvedInitial,
      error: undefined,
      status: "idle",
      updatedAt: null,
      createdAt: resolvedInitial !== undefined ? Date.now() : null,
      retryCount: 0,
    };
  }

  private notify(prevState: ResourceState<T>) {
    for (const sub of this.subscribers) {
      sub.listener(this.state, prevState);
    }
  }

  private getLatestConfig(): ConfigRef<T> | undefined {
    let last: ConfigRef<T> | undefined;
    for (const sub of this.subscribers) {
      last = sub.getConfig();
    }
    return last;
  }

  subscribe(sub: Subscription<T>, gcTime = 5 * 60 * 1000): () => void {
    if (this.gcTimer) {
      clearTimeout(this.gcTimer);
      this.gcTimer = null;
    }

    if (process.env.NODE_ENV !== "production") {
      const fetcherString = sub.getConfig().fetcher?.toString();
      if (this.devFetcherString && fetcherString && this.devFetcherString !== fetcherString) {
        console.warn(
          `useResource: Multiple components registered key "${this.key}" with different fetcher functions. ` +
            `This can lead to unpredictable data fetching. The first registered fetcher will be used.`
        );
      }
      if (!this.devFetcherString && fetcherString) {
        this.devFetcherString = fetcherString;
      }
    }

    this.subscribers.add(sub);
    this.subscriberCount++;

    return () => {
      this.subscribers.delete(sub);
      this.subscriberCount--;
      if (this.subscriberCount === 0) {
        this.scheduleGC(gcTime);
      }
    };
  }

  scheduleGC(gcTime: number) {
    if (this.gcTimer) clearTimeout(this.gcTimer);
    this.gcTimer = setTimeout(() => {
      if (this.abortController) {
        this.abortController.abort();
      }
      registry.delete(this.key);
    }, gcTime);
  }

  commit(patch: Partial<ResourceState<T>>) {
    const prevState = this.state;
    this.state = { ...this.state, ...patch };
    this.notify(prevState);

    if (patch.data !== undefined && this.cacheWriter) {
      let toWrite = patch.data;
      if (this.cacheExcludes && toWrite && typeof toWrite === "object") {
        toWrite = { ...toWrite };
        for (const k of this.cacheExcludes) {
          delete toWrite[k];
        }
      }
      console.log("cacheWriter called with", toWrite);
      this.cacheWriter(toWrite);
    }
  }

  setFromCache(data: T) {
    // Only adopt cache if we haven't fetched fresher data
    if (this.state.updatedAt === null && this.state.data !== data) {
      this.commit({ data, status: "success", error: undefined, updatedAt: Date.now() });
    }
  }

  forceAdoptCache(data: T) {
    if (!deepEqual(this.state.data, data)) {
      this.commit({ data, status: "success", error: undefined, updatedAt: Date.now() });
    }
  }

  async fetch() {
    const config = this.getLatestConfig();
    if (!config || !config.fetcher) return;

    this.generation++;
    const myGen = this.generation;

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    this.commit({
      status: this.state.data === undefined ? "loading" : "refreshing",
      error: undefined,
    });

    try {
      const result = await config.fetcher(this.abortController.signal);
      if (myGen !== this.generation) return;

      const finalResult = this.applyPendingMutations(result);

      this.commit({
        data: finalResult,
        status: "success",
        error: undefined,
        updatedAt: Date.now(),
        retryCount: 0,
      });

      if (config.onSuccess) config.onSuccess(finalResult);
    } catch (err: unknown) {
      if (myGen !== this.generation) return;

      const normErr = normalizeError(err);
      if (normErr.name === "AbortError") return;

      if (this.shouldRetry(normErr, config)) {
        this.scheduleRetry(config);
        return;
      }

      this.commit({
        status: "error",
        error: normErr,
      });
      if (config.onError) config.onError(normErr);
    }
  }

  private applyPendingMutations(serverData: T): T {
    if (this.pendingMutations.length === 0) return serverData;
    let current = deepClone(serverData);
    for (const patch of this.pendingMutations) {
      current = patch(current);
    }
    this.pendingMutations = [];
    return current;
  }

  mutate(updater: (current: T | undefined) => T) {
    const config = this.getLatestConfig();
    const snap = deepClone(this.state.data);
    const next = updater(snap);

    this.pendingMutations.push(updater as (c: T) => T);
    this.commit({ data: next });

    if (config?.onMutate) config.onMutate(next);
  }

  set(value: T) {
    this.pendingMutations = [];
    this.commit({ data: value, updatedAt: Date.now(), status: "success", error: undefined });
  }

  invalidate() {
    this.generation++;
    this.commit({ updatedAt: 0 }); // forces stale
  }

  reset() {
    this.generation++;
    this.pendingMutations = [];
    this.commit({
      data: undefined,
      error: undefined,
      status: "idle",
      updatedAt: null,
      retryCount: 0,
    });
  }

  shouldRetry(err: Error, config: ConfigRef<T>): boolean {
    const retry = config.retry ?? 0;
    if (typeof retry === "function") {
      return retry(err, this.state.retryCount);
    }
    return this.state.retryCount < retry;
  }

  scheduleRetry(config: ConfigRef<T>) {
    const attempt = this.state.retryCount;
    const delayFn =
      config.retryDelay ?? ((a) => Math.min(30_000, 2 ** a * 1000) + Math.random() * 250);
    const delay = typeof delayFn === "function" ? delayFn(attempt) : delayFn;

    this.commit({ retryCount: attempt + 1 });

    if (config.onRetry) {
      config.onRetry(attempt + 1, this.state.error || new Error("Retry"));
    }

    setTimeout(() => {
      this.fetch();
    }, delay);
  }
}

// ---------------------------------------------------------------------------
// Sub-controllers
// ---------------------------------------------------------------------------

function useResourceMemoryController<T>(ctrl: ResourceController<T>, enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/immutability
      ctrl.cacheWriter = undefined;
      // eslint-disable-next-line react-hooks/immutability
      ctrl.cacheClearer = undefined;
    }
  }, [ctrl, enabled]);
  return ctrl.state;
}

function useResourceSharedController<T>(
  ctrl: ResourceController<T>,
  enabled: boolean,
  initialData?: T
) {
  const [sharedState, setSharedState] = useSharedState<T | undefined>(
    `useResource:${ctrl.key}`,
    initialData,
    { enabled }
  );

  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/immutability
      ctrl.cacheWriter = setSharedState;
      // eslint-disable-next-line react-hooks/immutability
      ctrl.cacheClearer = () => setSharedState(undefined);
    }
  }, [ctrl, setSharedState, enabled]);

  const isInitialRead = useRef(true);
  useEffect(() => {
    if (enabled && sharedState !== undefined) {
      if (isInitialRead.current) {
        isInitialRead.current = false;
        ctrl.setFromCache(sharedState);
      } else {
        ctrl.forceAdoptCache(sharedState);
      }
    }
  }, [sharedState, enabled, ctrl]);

  return ctrl.state;
}

function useResourceIndexedDBController<T>(
  ctrl: ResourceController<T>,
  enabled: boolean,
  storeName: string,
  initialData?: T
) {
  const [idbState, setIdbState, meta] = useIndexedDB<T | undefined>(
    storeName,
    ctrl.key,
    initialData,
    { enabled }
  );

  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/immutability
      ctrl.cacheWriter = setIdbState;
      // eslint-disable-next-line react-hooks/immutability
      ctrl.cacheClearer = meta.remove;
    }
  }, [ctrl, setIdbState, meta.remove, enabled]);

  const isInitialRead = useRef(true);
  useEffect(() => {
    if (enabled && meta.status === "ready" && idbState !== undefined) {
      if (isInitialRead.current) {
        isInitialRead.current = false;
        ctrl.setFromCache(idbState);
      } else {
        ctrl.forceAdoptCache(idbState);
      }
    }
  }, [idbState, meta.status, enabled, ctrl]);

  useEffect(() => {
    if (enabled && meta.error) {
      console.log("error from IDB", meta.error);
      ctrl.commit({ error: meta.error, status: "error" });
    }
  }, [meta.error, enabled, ctrl]);

  return ctrl.state;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * A highly optimized hook for data fetching, caching, and state management.
 * Provides automatic background fetching, polling, persistence, tab-synchronization, and optimistic mutations.
 *
 * @template T The type of data managed by the resource.
 * @param config Configuration options for the resource, including the unique key and fetcher function.
 * @returns The current state of the resource, along with methods to refresh, mutate, and invalidate it.
 */
export function useResource<T>(config: ResourceConfig<T>): Resource<T> {
  const isServer = typeof window === "undefined";
  console.log("useResource render. key:", config.key, "isServer:", isServer);
  const {
    key,
    namespace = "default",
    cache = "memory",
    staleTime = 0,
    gcTime = 5 * 60 * 1000,
  } = config;
  const compositeKey = namespace ? `${namespace}:${key}` : key;
  const enabled = config.enabled !== false;

  const cacheRef = useRef(cache);
  if (process.env.NODE_ENV !== "production" && cacheRef.current !== cache) {
    console.warn(
      `useResource: "cache" changed from "${cacheRef.current}" to "${cache}" for key "${compositeKey}". ` +
        `Switching cache backends does not migrate existing data.`
    );
  }
  cacheRef.current = cache;

  const configRef = useRef<ConfigRef<T>>(config);
  configRef.current = config;

  const ctrlRef = useRef<ResourceController<T>>();
  if (!isServer && (!ctrlRef.current || ctrlRef.current.key !== compositeKey)) {
    ctrlRef.current = getOrCreateController<T>(compositeKey, config.initialData);
  }

  const [, forceUpdate] = useState(0);

  // Selector memoization tracking
  type SelectorEntry = {
    selector: (data: T | undefined) => unknown;
    equalityFn: (a: unknown, b: unknown) => boolean;
    result: unknown;
  };
  const selectorsRef = useRef<SelectorEntry[]>([]);
  selectorsRef.current = []; // clear on each render to only track active selectors

  // Track if non-data fields were read
  const readNonDataFieldsRef = useRef(false);
  readNonDataFieldsRef.current = false;

  useEffect(() => {
    if (isServer || !ctrlRef.current) return;
    const ctrl = ctrlRef.current;
    ctrl.cacheExcludes = configRef.current.persist?.exclude;

    const sub: Subscription<T> = {
      listener: (nextState, prevState) => {
        let shouldUpdate = true;

        const isFetchingPrev = prevState.status === "loading" || prevState.status === "refreshing";
        const isFetchingNext = nextState.status === "loading" || nextState.status === "refreshing";
        const isStalePrev =
          prevState.updatedAt === null || Date.now() - prevState.updatedAt >= staleTime;
        const isStaleNext =
          nextState.updatedAt === null || Date.now() - nextState.updatedAt >= staleTime;

        const nonDataChanged =
          nextState.status !== prevState.status ||
          nextState.error !== prevState.error ||
          isFetchingNext !== isFetchingPrev ||
          isStaleNext !== isStalePrev;

        if (!nonDataChanged && !readNonDataFieldsRef.current && selectorsRef.current.length > 0) {
          let allSame = true;
          for (const s of selectorsRef.current) {
            const newResult = s.selector(nextState.data);
            if (!s.equalityFn(s.result, newResult)) {
              allSame = false;
              break;
            }
          }
          if (allSame) {
            shouldUpdate = false;
          }
        }

        if (shouldUpdate) {
          forceUpdate((n) => n + 1);
        }
      },
      getConfig: () => configRef.current,
    };
    return ctrl.subscribe(sub, gcTime);
  }, [compositeKey, gcTime, staleTime, isServer]);

  const mockCtrl = useMemo(
    () => new ResourceController<T>(compositeKey, config.initialData),
    [compositeKey, config.initialData]
  );
  const activeCtrl = isServer ? mockCtrl : ctrlRef.current!;

  useResourceMemoryController(activeCtrl, cache === "memory" || cache === false);
  useResourceSharedController(activeCtrl, cache === "shared", config.initialData as T);
  useResourceIndexedDBController(
    activeCtrl,
    cache === "indexeddb",
    config.persist?.store ?? "resources",
    config.initialData as T
  );

  const triggerFetch = useCallback(() => {
    if (!isServer && enabled && activeCtrl) {
      const { status, updatedAt } = activeCtrl.state;
      if (status === "loading" || status === "refreshing") {
        return; // Piggyback on in-flight fetch
      }
      const isStale = updatedAt === null || Date.now() - updatedAt >= staleTime;
      if (isStale) {
        activeCtrl.fetch();
      }
    }
  }, [isServer, enabled, activeCtrl, staleTime]);

  useEffect(() => {
    if (enabled) {
      triggerFetch();
    }
  }, [triggerFetch, enabled]);

  const api = useMemo<Resource<T>>(() => {
    const base = {
      refresh: async () => {
        if (configRef.current.onRefresh) configRef.current.onRefresh();
        await activeCtrl.fetch();
      },
      invalidate: () => activeCtrl.invalidate(),
      reset: () => activeCtrl.reset(),
      set: (value: T) => activeCtrl.set(value),
      mutate: (updater: (current: T | undefined) => T) => activeCtrl.mutate(updater),
      select: <R>(selector: (data: T | undefined) => R, equalityFn = deepEqual): R => {
        const result = selector(activeCtrl.state.data);
        selectorsRef.current.push({ selector, equalityFn, result });
        return result;
      },
      __key: compositeKey,
    };

    // Use property getters to detect if the user reads non-data fields.
    // If they only read .select(), we can optimize re-renders.
    Object.defineProperties(base, {
      data: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.data;
        },
      },
      error: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.error;
        },
      },
      status: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.status;
        },
      },
      updatedAt: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.updatedAt;
        },
      },
      createdAt: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.createdAt;
        },
      },
      retryCount: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.retryCount;
        },
      },
      loading: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.status === "loading";
        },
      },
      fetching: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return activeCtrl.state.status === "loading" || activeCtrl.state.status === "refreshing";
        },
      },
      isStale: {
        get: () => {
          readNonDataFieldsRef.current = true;
          return (
            activeCtrl.state.updatedAt === null ||
            // eslint-disable-next-line react-hooks/purity
            Date.now() - activeCtrl.state.updatedAt >= staleTime
          );
        },
      },
    });

    return base as Resource<T>;
  }, [activeCtrl, compositeKey, staleTime]);

  return api;
}

// ---------------------------------------------------------------------------
// Composition & Static API
// ---------------------------------------------------------------------------

export function useResourceCompose<TDeps extends Record<string, Resource<unknown>>, R>(config: {
  key: string;
  deps: TDeps;
  selector: (values: { [K in keyof TDeps]: TDeps[K]["data"] }) => R;
  equalityFn?: (a: R, b: R) => boolean;
}): Resource<R> {
  const depValues = {} as { [K in keyof TDeps]: TDeps[K]["data"] };
  for (const k in config.deps) {
    depValues[k] = config.deps[k].data;
  }

  // We run useResource with a dummy fetcher because compose re-evaluates synchronously on dep changes.
  // The spec says it reuses the standard controller subscribe path.
  // But since it has dependencies, we can just feed the computed data into it via .set().
  const derivedResult = config.selector(depValues);

  const resource = useResource<R>({
    key: config.key,
    fetcher: async () => derivedResult,
    initialData: derivedResult,
    cache: "memory",
  });

  // When dependencies change, update the controller data if equalityFn says it changed.
  const eq = config.equalityFn ?? deepEqual;
  useEffect(() => {
    if (!eq(resource.data as R, derivedResult)) {
      resource.set(derivedResult);
    }
  }, [derivedResult, resource, eq]);

  return resource;
}

useResource.compose = useResourceCompose;

useResource.clear = function clear(key: string): void {
  const ctrl = registry.get(key);
  if (ctrl) {
    if (ctrl.gcTimer) clearTimeout(ctrl.gcTimer);
    if (ctrl.abortController) ctrl.abortController.abort();
    if (ctrl.cacheClearer) ctrl.cacheClearer();
    registry.delete(key);
  }
};

useResource.clearAll = function clearAll(): void {
  for (const key of registry.keys()) {
    useResource.clear(key);
  }
};
