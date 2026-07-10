import { Dispatch, SetStateAction } from "react";
export interface UseBooleanReturn {
    value: boolean;
    setValue: Dispatch<SetStateAction<boolean>>;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
}
export declare function useBoolean(initialValue?: boolean): UseBooleanReturn;
