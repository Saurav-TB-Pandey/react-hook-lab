import { deepClone } from "../../src/utils";
import type { Expect, Equal } from "./type-assertions";

// Deep clone preserves input object type
const original = { a: 1, b: "test", nested: { c: true } };
const cloned = deepClone(original);
type _CloneCheck = Expect<Equal<typeof cloned, { a: number; b: string; nested: { c: boolean } }>>;

// Deep clone preserves primitive types
const clonedNum = deepClone(42);
type _NumCheck = Expect<Equal<typeof clonedNum, 42>>;

// @ts-expect-error Requires argument
deepClone();
