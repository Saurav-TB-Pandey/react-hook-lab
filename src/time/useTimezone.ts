import { useState, useEffect } from "react";

/**
 * A React hook that safely returns the user's local timezone (e.g., "America/New_York").
 * It is SSR-safe and guarantees hydration matches by initializing to `null` on the server.
 * 
 * @returns {string | null} The timezone string from `Intl.DateTimeFormat`, or `null` during server-side rendering.
 */
export function useTimezone(): string | null {
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return timezone;
}

export default useTimezone;
