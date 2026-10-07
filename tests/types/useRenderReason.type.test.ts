import { useRenderReason, type RenderReasonInfo, type PropChange } from "../../src/debug";
import type { Expect, Equal } from "./type-assertions";

const info = useRenderReason("MyComponent", { count: 1, name: "Alice" });
type _InfoCheck = Expect<Equal<typeof info, RenderReasonInfo>>;
type _WastedCheck = Expect<Equal<typeof info.isWastedRender, boolean>>;
type _ChangesCheck = Expect<Equal<typeof info.changes, PropChange[]>>;

// @ts-expect-error Props must be Record<string, unknown>
useRenderReason("MyComponent", "invalid-props");
