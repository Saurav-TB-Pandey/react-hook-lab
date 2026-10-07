import { useDebounce, type UseDebounceOptions } from "../../src/async";
import type { Expect, Equal } from "./type-assertions";

const debouncedNum = useDebounce<number>(100, 300);
type _NumCheck = Expect<Equal<typeof debouncedNum, number>>;

const options: UseDebounceOptions<string> = { leading: true, trim: false, initialValue: "init" };
const debouncedStr = useDebounce<string>("test", 500, options);
type _StrCheck = Expect<Equal<typeof debouncedStr, string>>;

// @ts-expect-error Delay must be a number
useDebounce("val", "invalid");
