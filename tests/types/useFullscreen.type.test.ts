import { useFullscreen, type UseFullscreenReturn } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const fsDefault = useFullscreen();
type _DefaultCheck = Expect<Equal<typeof fsDefault, UseFullscreenReturn<HTMLDivElement>>>;

const fsCustom = useFullscreen<HTMLVideoElement>();
type _CustomCheck = Expect<Equal<typeof fsCustom, UseFullscreenReturn<HTMLVideoElement>>>;
type _IsFullscreen = Expect<Equal<typeof fsCustom.isFullscreen, boolean>>;

// @ts-expect-error Element must extend HTMLElement
useFullscreen<string>();
