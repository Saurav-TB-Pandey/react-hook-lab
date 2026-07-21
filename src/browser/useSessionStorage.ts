import { useEffect, useState } from "react";

/**
 * Synchronizes state with `sessionStorage` so it persists across reloads but clears when the tab closes.
 * Automatically parses JSON.
 *
 * @param key - The sessionStorage key.
 * @param initialValue - The fallback initial value if the key does not exist.
 * @returns A stateful value and a function to update it, matching `useState`.
 *
 * @example
 * ```tsx
 * const [draft, setDraft] = useSessionStorage("draft", "");
 * ```
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
  const readValue = (): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = sessionStorage.getItem(key);

      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [value, setValue] = useState<T>(readValue);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);

    if (typeof window === "undefined") return;

    sessionStorage.setItem(key, JSON.stringify(newValue));
  };

  useEffect(() => {
    setValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setStoredValue] as const;
}
