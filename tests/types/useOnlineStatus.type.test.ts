import { useOnlineStatus } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const isOnline = useOnlineStatus();
type _OnlineCheck = Expect<Equal<typeof isOnline, boolean>>;

// @ts-expect-error useOnlineStatus takes no arguments
useOnlineStatus(true);
