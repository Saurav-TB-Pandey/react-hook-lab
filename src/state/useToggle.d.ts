import { Dispatch, SetStateAction } from "react";
export declare function useToggle<T>(defaultValue: T, reverseValue?: T): {
    value: T;
    setValue: Dispatch<SetStateAction<T>>;
    toggle: () => void;
};
