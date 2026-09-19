import { useSessionStorage } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";
import type { Dispatch, SetStateAction } from "react";

const [token, setToken] = useSessionStorage<string | null>("token", null);
type _TokenCheck = Expect<Equal<typeof token, string | null>>;
type _SetToken = Expect<Equal<typeof setToken, Dispatch<SetStateAction<string | null>>>>;

// @ts-expect-error Initial value must match generic
useSessionStorage<number>("key", "string");
