import { useAsyncDebounce, type UseAsyncDebounceReturn } from "../../src/async";
import type { Expect, Equal } from "./type-assertions";

const debounced = useAsyncDebounce(async () => "result", 300);
type _ReturnCheck = Expect<Equal<typeof debounced, UseAsyncDebounceReturn<string>>>;
type _ResultCheck = Expect<Equal<typeof debounced.result, string | undefined>>;
type _LoadingCheck = Expect<Equal<typeof debounced.loading, boolean>>;

// @ts-expect-error Delay must be a number
useAsyncDebounce(async () => 123, "invalid-delay");
