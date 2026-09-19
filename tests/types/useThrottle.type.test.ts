import { useThrottle, type UseThrottleOptions } from "../../src/async";
import type { Expect, Equal } from "./type-assertions";

const throttledNum = useThrottle<number>(50, 200);
type _NumCheck = Expect<Equal<typeof throttledNum, number>>;

const options: UseThrottleOptions = { leading: true, trailing: false };
const throttledStr = useThrottle<string>("hello", 300, options);
type _StrCheck = Expect<Equal<typeof throttledStr, string>>;

// @ts-expect-error Interval must be a number
useThrottle("test", "invalid");
