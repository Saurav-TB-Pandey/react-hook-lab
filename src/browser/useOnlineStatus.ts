import { useEffect, useState } from "react";

/**
 * Tracks the browser's active network connection status dynamically.
 * Updates in real-time if the user's internet connection drops or restores.
 *
 * @returns boolean `true` if online, `false` if offline.
 *
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * return <div>{isOnline ? "Online" : "Offline"}</div>;
 * ```
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const goOnline = () => setIsOnline(true);

    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
};
