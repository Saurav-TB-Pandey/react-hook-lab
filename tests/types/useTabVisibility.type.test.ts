import { useTabVisibility, type UseTabVisibilityResult } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const visibility = useTabVisibility({ requireWindowFocus: true });
type _ReturnCheck = Expect<Equal<typeof visibility, UseTabVisibilityResult>>;
type _IsActive = Expect<Equal<typeof visibility.isActive, boolean>>;
type _IsVisible = Expect<Equal<typeof visibility.isVisible, boolean>>;

// @ts-expect-error Invalid option key
useTabVisibility({ invalidOption: 123 });
