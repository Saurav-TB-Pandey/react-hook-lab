import { deepEqual } from "../../src/utils";
import type { Expect, Equal } from "./type-assertions";

const result = deepEqual({ a: 1 }, { a: 1 });
type _ResultCheck = Expect<Equal<typeof result, boolean>>;

// @ts-expect-error Expects two arguments
deepEqual(1);
