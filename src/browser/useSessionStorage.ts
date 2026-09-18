import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Synchronizes state with `sessionStorage` so it persists across reloads but clears when the tab closes.
 * Automatically parses JSON, supports functional updates, and safely handles storage quota errors.
 *
 * @param key - The sessionStorage key.
 * @param initialValue - The fallback initial value if the key does not exist.
 * @returns A tuple matching `useState`: `[value, setStoredValue]`.
 *
 * @example
 * ```tsx
 * const [draft, setDraft] = useSessionStorage("draft", "");
 * setDraft(prev => prev + " new draft text");
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): readonly [T, Dispatch<SetStateAction<T>>] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = sessionStorage.getItem(key);

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
            sessionStorage.setItem(key, JSON.stringify(next));
          } catch {
            // Silently handle quota exceeded errors or private browsing mode
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

  return [value, setStoredValue] as const;
}

export default useSessionStorage;
