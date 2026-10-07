import { useURL, type UseURLReturn, type Breadcrumb } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const url = useURL();
type _ReturnCheck = Expect<Equal<typeof url, UseURLReturn>>;
type _HrefCheck = Expect<Equal<typeof url.href, string>>;
type _QueryCheck = Expect<Equal<typeof url.query, Record<string, string | string[]>>>;
type _BreadcrumbsCheck = Expect<Equal<typeof url.breadcrumbs, Breadcrumb[]>>;

// @ts-expect-error useURL takes no arguments
useURL("arg");
