import { useClipboard, type ClipboardState } from "../../src/browser";
import type { UseClipboardReturn } from "../../src/browser/useClipboard";
import type { Expect, Equal, Extends } from "./type-assertions";

const clipboard = useClipboard(1000);
type _ReturnCheck = Expect<Equal<typeof clipboard, UseClipboardReturn>>;
type _ExtendsCheck = Expect<Extends<UseClipboardReturn, ClipboardState>>;
type _CopiedCheck = Expect<Equal<typeof clipboard.copied, boolean>>;
type _CopyFnCheck = Expect<Equal<typeof clipboard.copy, (text: string) => Promise<boolean>>>;

// @ts-expect-error Timeout must be a number
useClipboard("2000");

// @ts-expect-error Copy expects a string
clipboard.copy(12345);
