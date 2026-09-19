import { useRef } from "react";
import { useElementSize, type ElementSize } from "../../src/dom";
import type { Expect, Equal } from "./type-assertions";

function TestComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  type _SizeCheck = Expect<Equal<typeof size, ElementSize>>;
  type _WidthCheck = Expect<Equal<typeof size.width, number>>;
  type _HeightCheck = Expect<Equal<typeof size.height, number>>;

  // @ts-expect-error Requires ref argument
  useElementSize();
}
