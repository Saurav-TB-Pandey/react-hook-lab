import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Synchronizes state with `localStorage` so it persists across browser reloads.
 * Automatically parses JSON and updates state when storage events fire from other tabs.
 * Supports functional updates and gracefully catches storage quota exceptions.
 *
 * @param key - The localStorage key.
 * @param initialValue - The fallback initial value if the key does not exist.
 * @returns A tuple matching `useState`: `[value, setStoredValue]`.
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage("theme", "light");
 * setTheme(prev => prev === "light" ? "dark" : "light");
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): readonly [T, Dispatch<SetStateAction<T>>] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = localStorage.getItem(key);

      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState<T>(readValue);

  const setStoredValue: Dispatch<SetStateAction<T>> = useCallback(
    (action: SetStateAction<T>) => {
      setValue((prev) => {
        const next = typeof action === "function" ? (action as (prevState: T) => T)(prev) : action;

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch {
            // Silently handle quota exceeded errors or restricted private browsing modes
          }
        }

        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    setValue(readValue());
  }, [key, readValue]);

  // Sync across browser tabs
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue !== null) {
          try {
            setValue(JSON.parse(event.newValue));
          } catch {
            setValue(initialValue);
          }
        } else {
          setValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [key, initialValue]);

  return [value, setStoredValue] as const;
}

export default useLocalStorage;
