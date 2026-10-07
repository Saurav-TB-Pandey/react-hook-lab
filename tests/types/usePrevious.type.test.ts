import { usePrevious } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";

// Overload 1: without defaultValue -> T | undefined
const prevWithoutDefault = usePrevious<number>(42);
type _NoDefaultCheck = Expect<Equal<typeof prevWithoutDefault, number | undefined>>;

// Overload 2: with defaultValue -> T
const prevWithDefault = usePrevious<string>("hello", "fallback");
type _WithDefaultCheck = Expect<Equal<typeof prevWithDefault, string>>;

// @ts-expect-error Default value type must match value type
usePrevious(123, "not-a-number");
