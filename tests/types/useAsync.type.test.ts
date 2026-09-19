import { useAsync, type UseAsyncReturn, type UseAsyncOptions } from "../../src/async";
import type { Expect, Equal } from "./type-assertions";

// Valid hook usage with Promise generic inference
const asyncRes = useAsync(async () => ({ id: 1, name: "test" }));
type _ResCheck = Expect<Equal<typeof asyncRes.data, { id: number; name: string } | undefined>>;
type _ErrorCheck = Expect<Equal<typeof asyncRes.error, Error | null>>;
type _LoadingCheck = Expect<Equal<typeof asyncRes.loading, boolean>>;

// With initialData option
const options: UseAsyncOptions<string> = { initialData: "initial", immediate: false };
const stringRes = useAsync(async () => "hello", [], options);
type _StringCheck = Expect<Equal<typeof stringRes.data, string | undefined>>;

// @ts-expect-error Handler must return Promise
useAsync(() => 123);

// @ts-expect-error initialData type must match
useAsync(async () => 123, [], { initialData: "invalid" });
