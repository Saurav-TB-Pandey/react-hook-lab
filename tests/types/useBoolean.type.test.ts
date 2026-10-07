import { useBoolean, type UseBooleanReturn } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";

const boolState = useBoolean(false);
type _ReturnCheck = Expect<Equal<typeof boolState, UseBooleanReturn>>;
type _ValueCheck = Expect<Equal<typeof boolState.value, boolean>>;
type _ToggleCheck = Expect<Equal<typeof boolState.toggle, () => void>>;

// @ts-expect-error initialValue must be boolean
useBoolean("invalid");
