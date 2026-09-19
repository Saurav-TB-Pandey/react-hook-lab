import { useInterval, type UseIntervalReturn } from "../../src/time";
import type { Expect, Equal } from "./type-assertions";

const interval = useInterval(() => {}, 1000);
type _ReturnCheck = Expect<Equal<typeof interval, UseIntervalReturn>>;
type _StartCheck = Expect<Equal<typeof interval.start, () => void>>;
type _IsRunning = Expect<Equal<typeof interval.isRunning, () => boolean>>;

// @ts-expect-error Callback must be a function
useInterval("not-a-fn", 1000);

// @ts-expect-error Delay must be a number
useInterval(() => {}, "1000");
