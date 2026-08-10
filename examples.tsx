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
  useDownload,
  useNotifications,
  useCamera,
  useMicrophone,
  useIdle,
  useTimezone,
  useDeepClone,
  useDeepMemo,
  useURL,
  useFullscreen,
  useLocation,
  useSharedState,
  useIndexedDB,
  createIndexedDB,
  useResource,
  useFileSystem,
  usePip,
  useCookie,
} from "react-hook-lab";

createIndexedDB({
  dbName: "examples-db",
  version: 1,
  stores: ["demo"]
});

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
    React.useCallback(async () => `Result for ${debouncedQuery}`, [debouncedQuery]),
    400
  );

  const online = useOnlineStatus();
  const width = useWidth();
  const clipboard = useClipboard();
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [draft, setDraft] = useSessionStorage("draft", "");
  const [cookieTheme, setCookieTheme] = useCookie("cookie_theme", { initialValue: "light" });
  const { download, status: downloadStatus } = useDownload();
  const { requestPermission, sendNotification } = useNotifications({ autoRequest: false });

  const camera = useCamera();
  const microphone = useMicrophone();
  const location = useLocation();
  const isIdle = useIdle();
  const timezone = useTimezone();
  const url = useURL();
  const fullscreen = useFullscreen();

  // Test object for deep cloning / deep memoization
  const testObj = { a: 1, nested: { b: 2 } };
  const clonedObj = useDeepClone(testObj);
  const memoizedValue = useDeepMemo(() => testObj.a + testObj.nested.b, [testObj]);

  const boolean = useBoolean(false);
  const counter = useCounter(0, { min: 0, max: 10, step: 2 });
  const toggle = useToggle("grid", "list");
  const [shared, setShared] = useSharedState("demo-shared-key", "Shared Value");
  const [dbVal, setDbVal, { status: dbStatus }] = useIndexedDB("demo", "example-key", "Initial DB Value");

  const resource = useResource({
    key: "example-resource",
    fetcher: async () => {
      await new Promise(r => setTimeout(r, 1000));
      return "Fetched Resource Data!";
    }
  });

  const fileSystem = useFileSystem({ accept: { 'text/plain': ['.txt'] } });
  const pip = usePip();

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
      <button onClick={() => setCookieTheme(cookieTheme === "light" ? "dark" : "light")}>
        Toggle Cookie theme
      </button>
      <button onClick={boolean.toggle}>Toggle boolean</button>
      <button onClick={counter.increment}>Increment counter</button>
      <button onClick={toggle.toggle}>Toggle layout</button>
      <button onClick={asyncState.retry}>Retry async</button>
      <button onClick={timeout.restart}>Restart timeout</button>
      <button onClick={interval.stop}>Stop interval</button>
      <button onClick={() => download({ demo: true }, "demo.json")}>Test Download ({downloadStatus})</button>
      <button onClick={() => { requestPermission().then(() => sendNotification("Test Notif")); }}>
        Test Notification
      </button>
      <button onClick={camera.requestCamera}>Request Camera</button>
      <button onClick={microphone.requestMicrophone}>Request Mic</button>
      <button onClick={location.retry}>Request Location</button>
      
      <button onClick={() => setShared(shared + "!")}>Test Shared State</button>
      <button onClick={() => setDbVal(dbVal + "!")}>Test IndexedDB</button>
      <button onClick={() => fileSystem.open()}>Open FS File</button>
      <button onClick={() => fileSystem.save('Example save content from examples.tsx')}>Save FS File</button>
      <button onClick={() => pip.isOpen ? pip.closePip() : pip.openPip()}>Toggle PIP</button>

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
        <p>Cookie Theme: {cookieTheme}</p>
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
        <p>Camera Status: {camera.status}</p>
        <p>Mic Status: {microphone.status}</p>
        <p>Location Status: {location.status}</p>
        <p>Idle: {isIdle ? "yes" : "no"}</p>
        <p>Timezone: {timezone || "loading..."}</p>
        <p>DeepClone Stable: {clonedObj ? "yes" : "no"}</p>
        <p>DeepMemo Value: {memoizedValue}</p>
        <p>Shared State: {shared}</p>
        <p>IndexedDB [{dbStatus}]: {dbVal}</p>
        <p>Resource: {resource.loading ? "Loading..." : resource.data}</p>
        <p>URL Path: {url.pathname}</p>
        <p>FileSystem File: {fileSystem.file?.name || "None"}</p>
        <p>FileSystem Content: {fileSystem.content ? fileSystem.content.slice(0, 20) + "..." : "None"}</p>
        <p>PIP Status: Supported={pip.isSupported ? "yes" : "no"}, Open={pip.isOpen ? "yes" : "no"}</p>
        
        <pip.Pip width={300} height={200}>
          <div style={{ padding: '10px', background: '#222', color: '#fff' }}>
            <h4>PIP Window Active</h4>
            <p>Shared State: {shared}</p>
            <p>Theme: {theme}</p>
            <button onClick={pip.closePip}>Close from inside</button>
          </div>
        </pip.Pip>

        <div ref={fullscreen.ref} style={{ background: fullscreen.isFullscreen ? '#222' : 'transparent', padding: '10px' }}>
          <p>Fullscreen State: {fullscreen.isFullscreen ? "Fullscreen ON" : "Fullscreen OFF"}</p>
          <button onClick={fullscreen.toggle}>Toggle Fullscreen</button>
        </div>
      </div>
    </section>
  );
}
