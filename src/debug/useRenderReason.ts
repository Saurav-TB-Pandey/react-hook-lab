import * as React from "react";
import { useEffect, useRef } from "react";


export type ChangeType =
  | "primitive-changed"
  | "reference-changed-value-changed"
  | "reference-changed-value-same"
  | "function-reference-changed";

export interface PropChange {
  key: string;
  type: ChangeType;
  from: unknown;
  to: unknown;
  hint?: string;
}

export interface RenderReasonInfo {
  componentName: string;
  renderCount: number;
  msSinceLastRender: number | null;
  changes: PropChange[];
  /** True when nothing tracked changed but the component still rendered. */
  isWastedRender: boolean;
  /** True when render frequency exceeded warnThreshold within warnWindowMs. */
  isSuspiciouslyFrequent: boolean;
}

export interface UseRenderReasonOptions {
  /** Deep-compare objects/arrays to distinguish reference vs value changes. Default: true. */
  deep?: boolean;
  /** Keys to exclude from tracking (e.g. large refs, children). */
  ignore?: string[];
  /** Renders within warnWindowMs above this count trigger a loop warning. Default: 10. */
  warnThreshold?: number;
  /** Sliding window size in ms for frequency detection. Default: 1000. */
  warnWindowMs?: number;
  /** Whether to print a formatted console.group report. Default: dev-only. */
  logToConsole?: boolean;
  /** Called on every render (after the first) with the full diagnostic info. */
  onRender?: (info: RenderReasonInfo) => void;
  /** Automatically detect and track changes in consumed Contexts. Default: true. */
  trackContexts?: boolean;
}

const MAX_DEPTH = 5;

function deepEqual(a: unknown, b: unknown, depth = 0, seen = new WeakSet<object>()): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== "object") return false; // functions/symbols already handled by Object.is
  if (depth >= MAX_DEPTH) return false;

  const objA = a as object;
  const objB = b as object;

  // Circular reference guard — bail out treating it as "equal enough"
  // rather than infinitely recursing or crashing.
  if (seen.has(objA)) return true;
  seen.add(objA);

  if (Array.isArray(objA) !== Array.isArray(objB)) return false;

  if (Array.isArray(objA)) {
    const arrB = objB as unknown[];
    if (objA.length !== arrB.length) return false;
    return objA.every((v, i) => deepEqual(v, arrB[i], depth + 1, seen));
  }

  if (objA instanceof Date && objB instanceof Date) {
    return objA.getTime() === objB.getTime();
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(objB, k) &&
      deepEqual(
        (objA as Record<string, unknown>)[k],
        (objB as Record<string, unknown>)[k],
        depth + 1,
        seen
      )
  );
}

function classifyChange(key: string, from: unknown, to: unknown, deep: boolean): PropChange | null {
  if (Object.is(from, to)) return null;

  const fromIsFn = typeof from === "function";
  const toIsFn = typeof to === "function";

  if (fromIsFn && toIsFn) {
    return {
      key,
      type: "function-reference-changed",
      from,
      to,
      hint: "New function identity every render — if this is passed to a memoized child, wrap it in useCallback.",
    };
  }

  // One side is a function and the other isn't (e.g. an optional callback
  // prop going from undefined to defined). Not the common case, but without
  // this branch it falls through to primitive-changed, where
  // JSON.stringify(fn) silently returns undefined and produces a useless
  // "undefined → undefined" log line.
  if (fromIsFn || toIsFn) {
    return {
      key,
      type: "function-reference-changed",
      from,
      to,
      hint: fromIsFn
        ? "Callback was removed (now undefined/non-function)."
        : "Callback was added (previously undefined/non-function).",
    };
  }

  const isObjA = from !== null && typeof from === "object";
  const isObjB = to !== null && typeof to === "object";

  if (isObjA && isObjB) {
    if (deep && deepEqual(from, to)) {
      return {
        key,
        type: "reference-changed-value-same",
        from,
        to,
        hint: "Same content, new reference. React uses strict equality (===) for props, so it sees this as a change (which breaks React.memo). This is usually caused by an inline object/array literal. Consider wrapping it in useMemo or moving it outside the component.",
      };
    }
    return { key, type: "reference-changed-value-changed", from, to };
  }

  return { key, type: "primitive-changed", from, to };
}

function extractContextChanges(deep: boolean): PropChange[] {
  const changes: PropChange[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const owner = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      ?.ReactCurrentOwner?.current;
    if (!owner || !owner.alternate || !owner.alternate.dependencies) return changes;

    let dep = owner.alternate.dependencies.firstContext;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispatcher = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      ?.ReactCurrentDispatcher?.current;

    while (dep) {
      const ctx = dep.context;
      const oldVal = dep.memoizedValue;

      let newVal = oldVal;
      if (dispatcher && typeof dispatcher.readContext === "function") {
        newVal = dispatcher.readContext(ctx);
      } else {
        const val1 = ctx._currentValue;
        const val2 = ctx._currentValue2;
        const defVal = ctx._defaultValue;

        if (!Object.is(val1, oldVal) && !Object.is(val1, defVal)) {
          newVal = val1;
        } else if (!Object.is(val2, oldVal) && !Object.is(val2, defVal)) {
          newVal = val2;
        } else if (!Object.is(val1, oldVal)) {
          newVal = val1;
        } else if (!Object.is(val2, oldVal)) {
          newVal = val2;
        }
      }

      if (!Object.is(newVal, oldVal)) {
        const name = ctx.displayName || "Unknown";
        const key = `Context(${name})`;
        const change = classifyChange(key, oldVal, newVal, deep);
        if (change) changes.push(change);
      }

      dep = dep.next;
    }
  } catch {
    // Silently fail if internal React Fiber structure changes
  }
  return changes;
}

/**
 * useRenderReason
 *
 * Diagnoses why a component just re-rendered. Pass in whatever props/state
 * you want tracked, and it classifies every change:
 *
 *  - primitive changed              → the value genuinely changed
 *  - reference changed, value SAME  → new object/array/function identity,
 *                                      but the content is identical — usually
 *                                      fixable with useMemo/useCallback
 *  - reference changed, value diff  → a real change to an object/array
 *  - function reference changed     → almost always an inline arrow function
 *
 * It also flags three things most re-render debugging misses entirely:
 *  - "wasted" renders — nothing tracked changed, so the parent likely
 *    re-rendered unnecessarily and dragged this component with it
 *  - Context changes — automatically peeks into the React Fiber to detect
 *    and classify any changes in consumed Contexts (no setup required)
 *  - "suspiciously frequent" renders — more renders than `warnThreshold`
 *    within `warnWindowMs`, a strong signal of a re-render loop
 *
 * This hook is completely zero-overhead in production!
 * When `process.env.NODE_ENV === 'production'`, it automatically skips
 * all tracking logic unless explicitly overridden, ensuring your app stays fast.
 *
 * @example
 * function ProductCard({ id, name, price, onAdd }: Props) {
 *   useRenderReason("ProductCard", { id, name, price, onAdd });
 *   ...
 * }
 *
 * @example With custom handling (e.g. feeding a dev overlay instead of console)
 * useRenderReason("ProductCard", { id, price }, {
 *   logToConsole: false,
 *   onRender: (info) => renderLog.push(info),
 * });
 */
export function useRenderReason(
  componentName: string,
  watched: Record<string, unknown>,
  options: UseRenderReasonOptions = {}
): RenderReasonInfo {
  const isProd = typeof process !== "undefined" && process.env.NODE_ENV === "production";
  const {
    deep = true,
    ignore = [],
    warnThreshold = 10,
    warnWindowMs = 1000,
    logToConsole = !isProd,
    trackContexts = true,
    onRender,
  } = options;

  const prevRef = useRef<Record<string, unknown> | null>(null);
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number | null>(null);
  const renderTimestampsRef = useRef<number[]>([]);

  // eslint-disable-next-line react-hooks/purity
  renderCountRef.current += 1;
  // eslint-disable-next-line react-hooks/purity
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const msSinceLastRender =
    lastRenderTimeRef.current !== null ? now - lastRenderTimeRef.current : null;

  // Sliding window: keep only timestamps within the last warnWindowMs.
  renderTimestampsRef.current.push(now);
  renderTimestampsRef.current = renderTimestampsRef.current.filter((t) => now - t <= warnWindowMs);
  const isSuspiciouslyFrequent = renderTimestampsRef.current.length > warnThreshold;

  const changes: PropChange[] = [];
  const skipTracking = !logToConsole && !onRender;

  if (prevRef.current && !skipTracking) {
    const keys = new Set([...Object.keys(prevRef.current), ...Object.keys(watched)]);
    for (const key of keys) {
      if (ignore.includes(key)) continue;
      const change = classifyChange(key, prevRef.current[key], watched[key], deep);
      if (change) changes.push(change);
    }

    if (trackContexts) {
      const contextChanges = extractContextChanges(deep);
      changes.push(...contextChanges);
    }
  }

  const isWastedRender = prevRef.current !== null && changes.length === 0 && !skipTracking;

  const info: RenderReasonInfo = {
    componentName,
    renderCount: renderCountRef.current,
    msSinceLastRender,
    changes,
    isWastedRender,
    isSuspiciouslyFrequent,
  };

  useEffect(() => {
    // Skip the initial mount — there's nothing to compare yet.
    if (renderCountRef.current > 1) {
      if (logToConsole) logRenderInfo(info);
      onRender?.(info);
    }
    prevRef.current = watched;
    lastRenderTimeRef.current = now;
  });

  return info;
}

function formatValue(value: unknown): string {
  if (typeof value === "function") return `ƒ ${value.name || "(anonymous)"}`;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "symbol") return value.toString();
  const str = JSON.stringify(value);
  return str === undefined ? String(value) : str;
}

function logRenderInfo(info: RenderReasonInfo): void {
  const {
    componentName,
    renderCount,
    msSinceLastRender,
    changes,
    isWastedRender,
    isSuspiciouslyFrequent,
  } = info;

  const timing =
    msSinceLastRender !== null ? ` (${msSinceLastRender.toFixed(1)}ms since last)` : "";
  console.groupCollapsed(
    `%c[useRenderReason] ${componentName} — render #${renderCount}${timing}`,
    "color:#8b5cf6;font-weight:bold;"
  );

  if (isSuspiciouslyFrequent) {
    console.warn(
      "Rendered more than expected in a short window — possible re-render loop or missing memoization."
    );
  }

  if (isWastedRender) {
    console.log(
      "%cNo tracked props/state changed — likely a wasted render triggered by a parent. Consider React.memo.",
      "color:#f59e0b;"
    );
  }

  for (const change of changes) {
    switch (change.type) {
      case "function-reference-changed":
      case "reference-changed-value-same":
        console.log(
          `%c${change.key}%c: ${
            change.type === "function-reference-changed" ? "function" : "object"
          } reference changed, value unchanged`,
          "font-weight:bold;",
          "font-weight:normal;"
        );
        console.log(`  → ${change.hint}`);
        console.log("  value:", change.to);
        break;
      case "reference-changed-value-changed":
        console.log(
          `%c${change.key}%c: object/array value changed`,
          "font-weight:bold;",
          "font-weight:normal;"
        );
        console.log("  before:", change.from);
        console.log("  after: ", change.to);
        break;
      case "primitive-changed":
        console.log(
          `%c${change.key}%c: ${formatValue(change.from)} → ${formatValue(change.to)}`,
          "font-weight:bold;",
          "font-weight:normal;"
        );
        break;
    }
  }

  console.groupEnd();
}
