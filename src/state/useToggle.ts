import { Dispatch, SetStateAction, useCallback, useState } from "react";

export function useToggle<T>(
  defaultValue: T,
  reverseValue?: T
) {
  const [value, setValue] = useState(defaultValue);

  const toggle = useCallback(() => {
    if (reverseValue !== undefined) {
      setValue((prev) =>
        prev === defaultValue ? reverseValue : defaultValue
      );
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