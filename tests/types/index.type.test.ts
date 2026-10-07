import * as Root from "../../src";
import DefaultExport from "../../src";
import type { Expect, Extends } from "./type-assertions";

// Check that hooks and utilities are exported
type _HasAsync = Expect<Extends<typeof Root.useAsync, Function>>;
type _HasDebounce = Expect<Extends<typeof Root.useDebounce, Function>>;
type _HasResource = Expect<Extends<typeof Root.useResource, Function>>;
type _HasDefaultUseAsync = Expect<Extends<typeof DefaultExport.useAsync, Function>>;
type _HasDefaultDeepClone = Expect<Extends<typeof DefaultExport.deepClone, Function>>;

// @ts-expect-error Non-existent export
Root.nonExistentHook;
