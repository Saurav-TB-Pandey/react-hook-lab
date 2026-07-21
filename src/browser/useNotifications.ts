import { useCallback, useEffect, useRef, useState } from "react";

export type NotificationPermissionStatus = NotificationPermission | "unsupported";

export interface UseNotificationsOptions {
  /**
   * If true, automatically prompts for notification permission on mount if current permission is "default".
   * Note: Some modern browsers may block automatic requests without a user gesture.
   * @default true
   */
  autoRequest?: boolean;
}

export interface UseNotificationsReturn {
  permission: NotificationPermissionStatus;
  isSupported: boolean;
  error: string | null;
  requestPermission: () => Promise<NotificationPermissionStatus>;
  sendNotification: (title: string, options?: NotificationOptions) => Notification | null;
  closeAllNotifications: () => void;
  recheckPermission: () => NotificationPermissionStatus;
}

function getPermission(): NotificationPermissionStatus {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

/**
 * Requests browser notification permission and sends local OS notifications.
 * Notifications work only on localhost or a secure HTTPS origin.
 *
 * @param options - Configuration object, supports `autoRequest` (defaults to true).
 * @returns Object containing permission state and methods to trigger or manage notifications.
 *
 * @example
 * ```tsx
 * const { sendNotification, requestPermission, permission } = useNotifications({ autoRequest: false });
 *
 * const handleNotify = () => {
 *   if (permission === "granted") {
 *     sendNotification("Hello World!", { body: "This is a local notification" });
 *   } else {
 *     requestPermission();
 *   }
 * };
 * ```
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoRequest = true } = options;
  const [permission, setPermission] = useState<NotificationPermissionStatus>(getPermission);
  const [error, setError] = useState<string | null>(null);
  const notificationsRef = useRef<Set<Notification>>(new Set());
  const hasAutoRequestedRef = useRef(false);

  const isSupported = permission !== "unsupported";

  const recheckPermission = useCallback(() => {
    const currentPermission = getPermission();
    setPermission(currentPermission);
    return currentPermission;
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      setError("OS notifications are not supported by this browser");
      return "unsupported";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setError(
        result === "denied"
          ? "Notification permission was denied. Enable it in the browser's site settings to try again."
          : null
      );
      return result;
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to request notification permission");
      return Notification.permission;
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, notificationOptions: NotificationOptions = {}): Notification | null => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setError("OS notifications are not supported by this browser");
        return null;
      }

      if (Notification.permission !== "granted") {
        setPermission(Notification.permission);
        setError("Grant notification permission before sending a notification");
        return null;
      }

      if (typeof title !== "string" || !title.trim()) {
        setError("A notification title is required");
        return null;
      }

      try {
        const notification = new Notification(title.trim(), notificationOptions);
        notificationsRef.current.add(notification);

        notification.addEventListener(
          "close",
          () => notificationsRef.current.delete(notification),
          { once: true }
        );
        notification.addEventListener(
          "error",
          () => setError("The browser could not display the notification"),
          { once: true }
        );

        setError(null);
        return notification;
      } catch (notificationError: any) {
        setError(notificationError?.message || "Unable to send the notification");
        return null;
      }
    },
    []
  );

  const closeAllNotifications = useCallback(() => {
    notificationsRef.current.forEach((notification) => notification.close());
    notificationsRef.current.clear();
  }, []);

  useEffect(() => {
    if (autoRequest && permission === "default" && !hasAutoRequestedRef.current) {
      hasAutoRequestedRef.current = true;
      void requestPermission();
    }
  }, [permission, requestPermission, autoRequest]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.addEventListener("focus", recheckPermission);
    document.addEventListener("visibilitychange", recheckPermission);

    return () => {
      window.removeEventListener("focus", recheckPermission);
      document.removeEventListener("visibilitychange", recheckPermission);
      closeAllNotifications();
    };
  }, [closeAllNotifications, recheckPermission]);

  return {
    permission,
    isSupported,
    error,
    requestPermission,
    sendNotification,
    closeAllNotifications,
    recheckPermission,
  };
}
