import React, { useRef, useState } from "react";
import {
  useAsync,
  useAsyncDebounce,
  useBoolean,
  useClickOutside,
  useClipboard,
  useCounter,
  useDebounce,
  useElementSize,
  useInterval,
  useIntersectionObserver,
  useLocalStorage,
  useOnlineStatus,
  usePrevious,
  useRenderReason,
  useResizeObserver,
  useSessionStorage,
  useThrottle,
  useTimeout,
  useToggle,
  useWidth,
} from "react-hook-lab";

export function ReactHookLabExamples() {
  const [query, setQuery] = useState("  search  ");
  const debouncedQuery = useDebounce(query, 300);
  const throttledQuery = useThrottle(query, 300);
  const previousQuery = usePrevious(query, "");

  const asyncState = useAsync(
    async () => "Loaded async data",
    [],
    { immediate: true }
  );

  const asyncDebounceState = useAsyncDebounce(
    async () => `Result for ${debouncedQuery}`,
    400
  );

  const online = useOnlineStatus();
  const width = useWidth();
  const clipboard = useClipboard();
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [draft, setDraft] = useSessionStorage("draft", "");

  const boolean = useBoolean(false);
  const counter = useCounter(0, { min: 0, max: 10, step: 2 });
  const toggle = useToggle("grid", "list");

  const panelRef = useRef<HTMLDivElement>(null);
  const measuredRef = useRef<HTMLDivElement>(null);
  const resize = useResizeObserver(measuredRef);
  const elementSize = useElementSize(measuredRef);
  const intersection = useIntersectionObserver(panelRef, {
    threshold: 0.5,
  });

  useRenderReason("ReactHookLabExamples", {
    query,
    debouncedQuery,
    throttledQuery,
    theme,
    boolean: boolean.value,
    counter: counter.count,
    toggle: toggle.value,
  });

  useClickOutside(panelRef, () => {
    boolean.setFalse();
  });

  const timeout = useTimeout(() => {
    console.log("Timeout fired");
  }, 1000);

  const interval = useInterval(() => {
    console.log("Interval tick");
  }, 1000);

  return (
    <section ref={panelRef}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />

      <button onClick={() => clipboard.copy(debouncedQuery)}>
        Copy search
      </button>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle theme
      </button>
      <button onClick={boolean.toggle}>Toggle boolean</button>
      <button onClick={counter.increment}>Increment counter</button>
      <button onClick={toggle.toggle}>Toggle layout</button>
      <button onClick={asyncState.retry}>Retry async</button>
      <button onClick={timeout.restart}>Restart timeout</button>
      <button onClick={interval.stop}>Stop interval</button>

      <div ref={measuredRef}>
        <p>Debounced: {debouncedQuery}</p>
        <p>Throttled: {throttledQuery}</p>
        <p>Previous: {previousQuery}</p>
        <p>Async: {asyncState.loading ? "Loading" : asyncState.data}</p>
        <p>
          Async debounce:{" "}
          {asyncDebounceState.loading
            ? "Loading"
            : asyncDebounceState.result}
        </p>
        <p>Online: {online ? "yes" : "no"}</p>
        <p>Window width: {width}</p>
        <p>Copied: {clipboard.copied ? "yes" : "no"}</p>
        <p>Theme: {theme}</p>
        <p>Boolean: {boolean.value ? "true" : "false"}</p>
        <p>Counter: {counter.count}</p>
        <p>Layout: {toggle.value}</p>
        <p>Resize observer width: {resize.width}</p>
        <p>Element size width: {elementSize.width}</p>
        <p>
          Intersecting: {intersection.isIntersecting ? "yes" : "no"}
        </p>
        <p>Timeout active: {timeout.isActive() ? "yes" : "no"}</p>
        <p>Interval running: {interval.isRunning() ? "yes" : "no"}</p>
      </div>
    </section>
  );
}
