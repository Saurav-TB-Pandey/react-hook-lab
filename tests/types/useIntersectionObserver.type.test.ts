import { useRef } from "react";
import { useIntersectionObserver, type UseIntersectionObserverReturn, type UseIntersectionObserverOptions } from "../../src/dom";
import type { Expect, Equal } from "./type-assertions";

function TestComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const options: UseIntersectionObserverOptions = { threshold: 0.5, freezeOnceVisible: true };
  const res = useIntersectionObserver(ref, options);
  type _ResCheck = Expect<Equal<typeof res, UseIntersectionObserverReturn>>;
  type _IsIntersecting = Expect<Equal<typeof res.isIntersecting, boolean>>;

  // @ts-expect-error Ref is required
  useIntersectionObserver();
}
