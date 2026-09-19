import { usePip, type UsePipResult } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const pip = usePip();
type _ReturnCheck = Expect<Equal<typeof pip, UsePipResult>>;
type _IsOpen = Expect<Equal<typeof pip.isOpen, boolean>>;

// @ts-expect-error Open pip options must be UsePipOptions
pip.openPip("invalid");
