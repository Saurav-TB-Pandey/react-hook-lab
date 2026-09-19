import { useToggle } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";
import type { Dispatch, SetStateAction } from "react";

// Boolean toggle
const boolToggle = useToggle(false);
type _BoolVal = Expect<Equal<typeof boolToggle.value, boolean>>;
type _BoolToggle = Expect<Equal<typeof boolToggle.toggle, () => void>>;

// Value toggle ("light" | "dark")
const themeToggle = useToggle<"light" | "dark">("light", "dark");
type _ThemeVal = Expect<Equal<typeof themeToggle.value, "light" | "dark">>;
type _ThemeSet = Expect<Equal<typeof themeToggle.setValue, Dispatch<SetStateAction<"light" | "dark">>>>;

// @ts-expect-error reverseValue must match defaultValue type
useToggle("light", 123);
