import { useIdle } from "../../src/dom";
import type { Expect, Equal } from "./type-assertions";

const isIdle = useIdle(5000, ["mousemove", "keydown"]);
type _IdleCheck = Expect<Equal<typeof isIdle, boolean>>;

// @ts-expect-error Timeout must be number
useIdle("5000");

// @ts-expect-error Events must be keyof WindowEventMap
useIdle(1000, ["invalid-event"]);
