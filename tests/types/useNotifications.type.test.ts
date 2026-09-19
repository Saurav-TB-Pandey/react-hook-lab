import { useNotifications, type UseNotificationsReturn, type NotificationPermissionStatus } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const notif = useNotifications({ autoRequest: false });
type _ReturnCheck = Expect<Equal<typeof notif, UseNotificationsReturn>>;
type _PermCheck = Expect<Equal<typeof notif.permission, NotificationPermissionStatus>>;

// @ts-expect-error Options must be UseNotificationsOptions
useNotifications(12345);
