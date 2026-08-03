import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Toggle between two generic values (e.g., "light" and "dark").
 * Falls back to boolean toggle if no reverseValue is provided.
 *
 * @param defaultValue - The primary value.
 * @param reverseValue - The secondary value to toggle to.
 * @returns Object containing the current value, setValue, and a toggle function.
 *
 * @example
 * ```tsx
 * const { value: mode, toggle: toggleMode } = useToggle("light", "dark");
 * return <button onClick={toggleMode}>Current: {mode}</button>;
 * ```
 */
export function useToggle<T>(defaultValue: T, reverseValue?: T) {
  const [value, setValue] = useState(defaultValue);

  const toggle = useCallback(() => {
    if (reverseValue !== undefined) {
      setValue((prev) => (prev === defaultValue ? reverseValue : defaultValue));
    } else {
      setValue((prev) => !prev as T);
    }
  }, [defaultValue, reverseValue]);

  return {
    value,
    setValue: setValue as Dispatch<SetStateAction<T>>,
    toggle,
  };
}
