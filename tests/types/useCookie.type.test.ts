import { useCookie, type CookieOptions } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const [value, setCookie, deleteCookie] = useCookie("token", { days: 7, secure: true });
type _ValCheck = Expect<Equal<typeof value, string | undefined>>;
type _SetCheck = Expect<Equal<typeof setCookie, (value: string, setOptions?: CookieOptions) => void>>;
type _DelCheck = Expect<Equal<typeof deleteCookie, (deleteOptions?: Pick<CookieOptions, "path" | "domain">) => void>>;

// @ts-expect-error Cookie key must be string
useCookie(123);

// @ts-expect-error Value to set must be string
setCookie(123);
