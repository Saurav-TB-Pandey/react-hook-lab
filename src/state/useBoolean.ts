import { Dispatch, SetStateAction, useCallback, useState } from "react";

export interface UseBooleanReturn {
  value: boolean;
  setValue: Dispatch<SetStateAction<boolean>>;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
}

/**
 * Easily manage a boolean state with dedicated `on`, `off`, and `toggle` methods.
 * Prevents needing to write `() => setX(true)` all over your components.
 *
 * @param initialValue - The initial boolean state (default: false).
 * @returns Object containing the current `value` and strict modifier functions.
 *
 * @example
 * ```tsx
 * const modal = useBoolean(false);
 * return <button onClick={modal.toggle}>Toggle Modal</button>;
 * ```
 */
export function useBoolean(initialValue = false): UseBooleanReturn {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return {
    value,
    setValue,
    setTrue,
    setFalse,
    toggle,
  };
}
