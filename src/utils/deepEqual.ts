/**
 * Deeply compares two values for structural equality.
 *
 * Supports primitives, arrays, plain objects, Date, RegExp, Map, and Set.
 * Safely handles circular references to prevent infinite recursion.
 *
 * @param a - The first value to compare
 * @param b - The second value to compare
 * @returns {boolean} True if the values are structurally equal, false otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepEqual(a: any, b: any, seen = new WeakMap<object, object>()): boolean {
  if (Object.is(a, b)) return true;

  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  // Handle circular references
  if (seen.has(a)) return seen.get(a) === b;
  seen.set(a, b);

  // Handle arrays
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], seen)) return false;
    }
    return true;
  }

  // Handle Date
  if (a instanceof Date) {
    if (!(b instanceof Date) || a.getTime() !== b.getTime()) return false;
    return true;
  }

  // Handle RegExp
  if (a instanceof RegExp) {
    if (!(b instanceof RegExp) || a.source !== b.source || a.flags !== b.flags) return false;
    return true;
  }

  // Handle Map
  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key), seen)) return false;
    }
    return true;
  }

  // Handle Set (Note: Set deep equality for complex objects is O(N^2),
  // we do strict reference check for Set elements to remain scalable)
  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }

  // Handle plain objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!deepEqual((a as any)[key], (b as any)[key], seen)) return false;
  }

  return true;
}
