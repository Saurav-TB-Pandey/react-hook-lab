import { useEffect, useState } from "react";

/**
 * Synchronizes state with `localStorage` so it persists across browser reloads.
 * Automatically parses JSON and updates state when storage events fire from other tabs.
 *
 * @param key - The localStorage key.
 * @param initialValue - The fallback initial value if the key does not exist.
 * @returns A stateful value and a function to update it, matching `useState`.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage("theme", "light");
 * ```
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = (): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = localStorage.getItem(key);

      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(readValue);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);

    if (typeof window === "undefined") return;

    localStorage.setItem(key, JSON.stringify(newValue));
  };

  useEffect(() => {
    setValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setStoredValue] as const;
}
