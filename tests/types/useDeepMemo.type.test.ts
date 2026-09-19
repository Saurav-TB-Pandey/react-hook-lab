import { useDeepMemo } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";

const computed = useDeepMemo(() => ({ sum: 1 + 2 }), [1, 2]);
type _ComputedCheck = Expect<Equal<typeof computed, { sum: number }>>;

// @ts-expect-error Factory must return a value
useDeepMemo("not-a-function", []);

// @ts-expect-error Dependencies array required
useDeepMemo(() => 42);
