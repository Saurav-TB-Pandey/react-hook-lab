import { useTimeout, type UseTimeoutReturn } from "../../src/time";
import type { Expect, Equal } from "./type-assertions";

const timeout = useTimeout(() => {}, 2000);
type _ReturnCheck = Expect<Equal<typeof timeout, UseTimeoutReturn>>;
type _Start = Expect<Equal<typeof timeout.start, () => void>>;
type _Clear = Expect<Equal<typeof timeout.clear, () => void>>;
type _IsActive = Expect<Equal<typeof timeout.isActive, () => boolean>>;

// @ts-expect-error Callback must be function
useTimeout("not-fn", 2000);

// @ts-expect-error Delay must be number
useTimeout(() => {}, "2000");
