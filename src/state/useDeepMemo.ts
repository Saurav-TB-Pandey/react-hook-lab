import { useRef, type DependencyList } from "react";
import { deepEqual } from "../utils/deepEqual";

/**
 * Like `useMemo`, but compares dependencies by deep value equality
 * instead of strict reference equality. Useful when a dependency is an object/array
 * literal that is recreated each render but contains the identical contents.
 *
 * @param factory - The function that computes the value
 * @param deps - The dependencies array
 * @returns The memoized value
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T } | undefined>(undefined);

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}
