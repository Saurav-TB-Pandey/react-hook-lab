import { useTimezone } from "../../src/time";
import type { Expect, Equal } from "./type-assertions";

const tz = useTimezone();
type _TzCheck = Expect<Equal<typeof tz, string | null>>;

// @ts-expect-error useTimezone takes no arguments
useTimezone("arg");
