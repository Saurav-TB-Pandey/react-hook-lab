import { useLocalStorage } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";
import type { Dispatch, SetStateAction } from "react";

const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
type _ThemeCheck = Expect<Equal<typeof theme, "light" | "dark">>;
type _SetTheme = Expect<Equal<typeof setTheme, Dispatch<SetStateAction<"light" | "dark">>>>;

// @ts-expect-error Incompatible initial value
useLocalStorage<number>("count", "not-a-number");
