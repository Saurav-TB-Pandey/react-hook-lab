import { useEffect, useState } from "react";

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
