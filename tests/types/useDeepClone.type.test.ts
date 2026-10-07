import { useDeepClone } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";

const original = { id: 1, tags: ["a", "b"] };
const cloned = useDeepClone(original);
type _ClonedCheck = Expect<Equal<typeof cloned, { id: number; tags: string[] }>>;

// @ts-expect-error Value argument is required
useDeepClone();
