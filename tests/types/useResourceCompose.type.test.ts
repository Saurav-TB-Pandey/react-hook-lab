import { useResource, useResourceCompose, type Resource } from "../../src/data";
import type { Expect, Equal } from "./type-assertions";

const resA = useResource<number>({ key: "a", fetcher: async () => 10 });
const resB = useResource<string>({ key: "b", fetcher: async () => "items" });

const composed = useResourceCompose({
  key: "combined",
  deps: { a: resA, b: resB },
  selector: ({ a, b }) => b + ": " + a,
});

type _ComposedCheck = Expect<Equal<typeof composed, Resource<string>>>;
type _DataCheck = Expect<Equal<typeof composed.data, string | undefined>>;

// @ts-expect-error deps is required
useResourceCompose({ key: "missing-deps" });

