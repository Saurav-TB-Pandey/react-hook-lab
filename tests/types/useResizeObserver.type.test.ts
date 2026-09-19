import { useRef } from "react";
import { useResizeObserver, type UseResizeObserverReturn, type Size } from "../../src/dom";
import type { Expect, Equal } from "./type-assertions";

function TestComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const res = useResizeObserver(ref, { box: "border-box" });
  type _ResCheck = Expect<Equal<typeof res, UseResizeObserverReturn>>;
  type _SizeCheck = Expect<Equal<typeof res.size, Size>>;
  type _WidthCheck = Expect<Equal<typeof res.width, number>>;

  // @ts-expect-error Ref is required
  useResizeObserver();
}
