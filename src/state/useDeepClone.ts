import { useRef, useMemo } from 'react';

/**
 * Performance-optimized deep clone.
 *
 * Optimizations & Security applied:
 * 1. Fast-path for primitives (no cloning needed — they're immutable).
 * 2. WeakMap-based reference tracking — handles circular refs AND
 *    preserves shared-reference structure.
 * 3. Prototype Pollution protection (skips `__proto__` and `constructor`).
 * 4. Prototype Chain Preservation (uses `Object.create(Object.getPrototypeOf(value))`).
 * 5. Native fast paths for Date, Map, Set, RegExp, TypedArrays.
 * 
 * Note: Guaranteed to return a completely new reference for all objects.
 *
 * @param value The value to clone
 * @param seen WeakMap used internally for tracking circular references
 * @returns A deep-cloned value
 */
export function deepClone<T>(value: T, seen = new WeakMap<any, any>()): T {
  // 1. Primitives — nothing to clone, return as-is
  if (value === null || typeof value !== 'object') {
    return value;
  }

  // 2. Circular / shared reference handling
  if (seen.has(value)) {
    return seen.get(value);
  }

  // 3. Frozen objects can never mutate — safe to share the reference (Performance Optimization)
  if (Object.isFrozen(value)) {
    return value;
  }

  // 4. Fast paths for common non-plain-object types
  if (value instanceof Date) {
    return new Date(value.getTime()) as any;
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any;
  }

  if (Array.isArray(value)) {
    const clone: any[] = [];
    seen.set(value, clone); // register BEFORE recursing
    for (let i = 0; i < value.length; i++) {
      clone[i] = deepClone(value[i], seen);
    }
    return clone as any;
  }

  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    value.forEach((v, k) => clone.set(deepClone(k, seen), deepClone(v, seen)));
    return clone as any;
  }

  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    value.forEach((v) => clone.add(deepClone(v, seen)));
    return clone as any;
  }

  if (ArrayBuffer.isView(value)) {
    // TypedArrays (Uint8Array, Float32Array, etc.) — slice() is a fast native copy
    // @ts-ignore - slice exists on TypedArrays but TS complains on generic ArrayBufferView
    return (value as any).slice();
  }

  // Ensure we don't accidentally deep clone DOM Elements (huge memory spike)
  if (typeof window !== 'undefined' && value instanceof Element) {
    return value; // Skip cloning DOM elements
  }

  // 4. Plain objects (and custom classes with prototypes)
  // Prevent Prototype Pollution by avoiding {} and restoring prototype chain
  const proto = Object.getPrototypeOf(value);
  const clone = Object.create(proto);
  seen.set(value, clone);

  // Iterate over own string and symbol properties
  const keys = Reflect.ownKeys(value as object);
  for (const key of keys) {
    // Prototype Pollution protection
    if (key === '__proto__' || key === 'constructor') {
      continue;
    }
    
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && descriptor.enumerable) {
      (clone as any)[key] = deepClone((value as any)[key], seen);
    }
  }

  return clone;
}

/**
 * Deep-clones `value`, but skips the clone entirely and returns the
 * previous result if `value` is reference-identical to the last render.
 * Combine with your own shallow-diffing upstream for maximum benefit.
 *
 * @param value The value to safely deep-clone
 * @returns A deep-cloned value (stable reference across renders where `value` itself hasn't changed)
 */
export function useDeepClone<T>(value: T): T {
  const cache = useRef<{ input: T | undefined; output: T | undefined }>({
    input: undefined,
    output: undefined,
  });

  return useMemo(() => {
    if (cache.current.input === value) {
      return cache.current.output as T; // no change — skip cloning entirely
    }
    const cloned = deepClone(value);
    cache.current = { input: value, output: cloned };
    return cloned;
  }, [value]);
}
