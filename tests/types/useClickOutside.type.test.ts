import { useRef } from "react";
import { useClickOutside, type UseClickOutsideOptions } from "../../src/dom";

function TestComponent() {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, (event) => {
    const _ev: Event = event;
  });

  const options: UseClickOutsideOptions = { enabled: true, events: ["mousedown", "click"] };
  useClickOutside([ref], () => {}, options);

  // @ts-expect-error Handler must be a function
  useClickOutside(ref, "not-a-function");

  // @ts-expect-error Invalid event type in options
  useClickOutside(ref, () => {}, { events: ["invalid-event"] });
}
