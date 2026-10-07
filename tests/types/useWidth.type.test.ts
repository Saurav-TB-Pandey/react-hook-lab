import { useWidth } from "../../src/dom";
import type { Expect, Equal } from "./type-assertions";

const width = useWidth();
type _WidthCheck = Expect<Equal<typeof width, number>>;

// @ts-expect-error useWidth takes no arguments
useWidth(100);
