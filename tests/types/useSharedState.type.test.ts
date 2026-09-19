import { useSharedState, type SharedStateSetter } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";

const [sharedNum, setSharedNum] = useSharedState<number>("counter", 0);
type _ValCheck = Expect<Equal<typeof sharedNum, number>>;
type _SetterCheck = Expect<Equal<typeof setSharedNum, SharedStateSetter<number>>>;

// @ts-expect-error Initial value must match type
useSharedState<number>("key", "not-a-number");
