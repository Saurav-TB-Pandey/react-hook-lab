import { useResource, type Resource, type ResourceConfig } from "../../src/data";
import type { Expect, Equal } from "./type-assertions";

interface User {
  id: number;
  name: string;
}

const config: ResourceConfig<User> = {
  key: "user-1",
  fetcher: async () => ({ id: 1, name: "Alice" }),
  initialData: { id: 1, name: "Alice" },
};

const resource = useResource(config);
type _ResourceCheck = Expect<Equal<typeof resource, Resource<User>>>;
type _DataCheck = Expect<Equal<typeof resource.data, User | undefined>>;
type _LoadingCheck = Expect<Equal<typeof resource.loading, boolean>>;

// @ts-expect-error Fetcher is required
useResource({ key: "missing-fetcher" });
