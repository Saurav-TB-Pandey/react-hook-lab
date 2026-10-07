import { useLocation, type UseLocationReturn, type LocationData, type LocationStatus } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const loc = useLocation();
type _ReturnCheck = Expect<Equal<typeof loc, UseLocationReturn>>;
type _LocData = Expect<Equal<typeof loc.location, LocationData | null>>;
type _LocStatus = Expect<Equal<typeof loc.status, LocationStatus>>;

// @ts-expect-error useLocation takes no arguments
useLocation("unexpected-arg");
