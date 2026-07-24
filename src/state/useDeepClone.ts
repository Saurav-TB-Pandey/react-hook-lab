import { useRef, useMemo } from 'react';
import { deepClone } from '../utils/deepClone';

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
