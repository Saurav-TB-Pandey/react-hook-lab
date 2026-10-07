import { useIndexedDB, createIndexedDB, type IndexedDBConfig, type IndexedDBMeta } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const config: IndexedDBConfig = { dbName: "test-db", version: 1, stores: ["users"] };
createIndexedDB(config);

const [user, setUser, meta] = useIndexedDB<{ name: string }>("users", "key-1", { name: "default" });
type _UserCheck = Expect<Equal<typeof user, { name: string }>>;
type _MetaCheck = Expect<Equal<typeof meta, IndexedDBMeta>>;

// @ts-expect-error Store name must be string
useIndexedDB(123, "key", {});
