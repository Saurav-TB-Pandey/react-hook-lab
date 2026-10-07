import { useCounter, type UseCounterReturn, type UseCounterOptions } from "../../src/state";
import type { Expect, Equal } from "./type-assertions";

const options: UseCounterOptions = { min: 0, max: 100, step: 2 };
const counter = useCounter(10, options);
type _ReturnCheck = Expect<Equal<typeof counter, UseCounterReturn>>;
type _CountCheck = Expect<Equal<typeof counter.count, number>>;
type _SetCheck = Expect<Equal<typeof counter.set, (val: number) => void>>;

// @ts-expect-error initialValue must be number
useCounter("0");

// @ts-expect-error set requires number
counter.set("5");
