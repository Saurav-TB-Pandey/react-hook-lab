# 🧪 react-hook-lab

[![npm version](https://img.shields.io/npm/v/react-hook-lab.svg)](https://www.npmjs.com/package/react-hook-lab)
[![npm downloads](https://img.shields.io/npm/dt/react-hook-lab.svg)](https://www.npmjs.com/package/react-hook-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=Saurav-TB-Pandey.react-hook-lab)

A robust, strictly-typed, and lightweight collection of reusable React hooks. 

`react-hook-lab` is designed to solve the most common challenges in React development without bloating your bundle. Whether you need to sync state across browser tabs, deeply diagnose why your components are re-rendering, debounce async API calls, or observe DOM intersections—this library has you covered.

### 🌟 Key Features
- **Zero Dependencies:** (Except for React itself).
- **Fully Typed:** Written entirely in TypeScript with precise generic types.
- **Tree-shakeable:** Import exactly what you need; leave the rest behind.
- **Server-Side Rendering (SSR) Safe:** Built with Next.js and Remix in mind. Browser APIs gracefully degrade on the server.
- **Comprehensive Test Suite:** High test coverage ensuring rock-solid stability in production.

---

## 📖 Table of Contents

- [Installation](#installation)
- [Hooks Overview](#hooks-overview)
- [API Documentation](#api-documentation)
  - [⏱️ Async & Timing Hooks](#-async--timing-hooks)
  - [🌐 Browser & DOM Hooks](#-browser--dom-hooks)
  - [💾 State Management Hooks](#-state-management-hooks)
  - [🐛 Debugging Hooks](#-debugging-hooks)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)

---

## 🚀 Installation

```bash
# Using npm
npm install react-hook-lab

# Using yarn
yarn add react-hook-lab

# Using pnpm
pnpm add react-hook-lab
```

*Note: `react` (v16.8+) is a peer dependency and must be installed in your project.*

---

## 🧰 Hooks Overview

### Async & Timing
| Hook | Description |
|------|-------------|
| `useAsync` | Execute a promise-returning function and track its `status`, `value`, and `error`. |
| `useAsyncDebounce` | Debounce an asynchronous callback (perfect for API searches). |
| `useDebounce` | Delay state updates by a given time to avoid rapid renders. |
| `useThrottle` | Limit the rate at which a state can update. |
| `useInterval` | Declarative `setInterval` that handles cleanup and closure staleness. |
| `useTimeout` | Declarative `setTimeout` that handles cleanup. |
| `useTimezone` | Safely access the user's local timezone (SSR compatible). |

### Browser & DOM
| Hook | Description |
|------|-------------|
| `useClipboard` | Read and write text to the user's clipboard with a temporary `copied` state. |
| `useOnlineStatus` | Track the browser's online/offline network status dynamically. |
| `useDownload` | Download JSON objects, Blobs, strings, or fetch remote URLs programmatically. |
| `useNotifications` | Request OS notification permissions and dispatch native alerts. |
| `useCamera` | Request camera access and record video/audio natively. |
| `useMicrophone` | Request microphone access and monitor real-time volume levels. |
| `useLocation` | Access the browser's Geolocation API securely. |
| `useIdle` | Track user inactivity across the browser tab efficiently. |
| `useClickOutside` | Detect clicks outside a specified element (great for dropdowns/modals). |
| `useElementSize` | Track the width and height of an HTML element. |
| `useIntersectionObserver`| Detect visibility of an element on screen (for lazy loading). |
| `useResizeObserver` | React to changes in a DOM element's dimensions. |
| `useWidth` | Track the global window inner width. |

### State Management
| Hook | Description |
|------|-------------|
| `useSharedState` | Share state seamlessly across components *and* browser tabs in real-time. |
| `useLocalStorage` | Persist and sync state in `localStorage`. |
| `useSessionStorage` | Persist and sync state in `sessionStorage`. |
| `useDeepClone` | Securely deep-clone objects while returning stable references across re-renders to fix broken memoization. |
| `useBoolean` | Manage a boolean state with specific methods (`on`, `off`, `toggle`). |
| `useCounter` | Manage a numeric counter with built-in min/max bounds. |
| `usePrevious` | Store the previous value of a state or prop after a render. |
| `useToggle` | Toggle between two generic values. |

### Debugging
| Hook | Description |
|------|-------------|
| `useRenderReason` | Deeply diagnose why a component re-rendered (wasted renders, loops, etc). |

---

## 📚 API Documentation

### ⏱️ Async & Timing Hooks

#### `useAsync`
Manage complex asynchronous data fetching with a clean state object.
```tsx
import { useAsync } from "react-hook-lab";

function UserProfile({ userId }) {
  const { execute, status, value, error } = useAsync(
    () => fetch(`/api/users/${userId}`).then((res) => res.json()),
    [userId]
  );

  if (status === "idle") return <button onClick={execute}>Fetch User</button>;
  if (status === "pending") return <div>Loading spinner...</div>;
  if (status === "error") return <div>Error: {error.message}</div>;
  return <div>Welcome, {value?.name}</div>;
}
```

#### `useAsyncDebounce`
Debounce an asynchronous callback. Useful for preventing spam API calls when a user types in an autocomplete search box.
```tsx
import { useAsyncDebounce } from "react-hook-lab";

function Search() {
  const fetchAutocomplete = useAsyncDebounce(async (query) => {
    return await api.get(`/search?q=${query}`);
  }, 300); // Only fires 300ms after the last keystroke
}
```

#### `useDebounce`
Debounce a fast-changing state value. The debounced value will only reflect the latest value after the specified delay has passed.
```tsx
import { useState } from "react";
import { useDebounce } from "react-hook-lab";

function Input() {
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounce(term, 500);

  // 'debouncedTerm' only updates 500ms after the user stops typing
  return <input onChange={(e) => setTerm(e.target.value)} />;
}
```

#### `useThrottle`
Throttle a state value so that it updates at most once every specified number of milliseconds.
```tsx
import { useState } from "react";
import { useThrottle } from "react-hook-lab";

function ScrollTracker() {
  const [scroll, setScroll] = useState(0);
  const throttledScroll = useThrottle(scroll, 200);
  // throttledScroll will update maximally once every 200ms regardless of how fast you scroll
}
```

#### `useInterval`
A declarative `setInterval` hook that safely handles cleanup and React's closure staleness issues.
```tsx
import { useState } from "react";
import { useInterval } from "react-hook-lab";

function Clock() {
  const [time, setTime] = useState(0);
  // Pass 'null' as the delay to pause the interval!
  useInterval(() => setTime((t) => t + 1), 1000);
}
```

#### `useTimeout`
A declarative `setTimeout` hook.
```tsx
import { useState } from "react";
import { useTimeout } from "react-hook-lab";

function Notification() {
  const [show, setShow] = useState(true);
  useTimeout(() => setShow(false), 5000);
  
  if (!show) return null;
  return <div>This will disappear in 5 seconds!</div>;
}
```

#### `useTimezone`
Safely access the user's local timezone. Guarantees safe SSR hydration by returning `null` on the server and resolving in the client.
```tsx
import { useTimezone } from "react-hook-lab";

function Welcome() {
  const timezone = useTimezone();
  return <div>Your timezone is: {timezone || 'Loading...'}</div>;
}
```

---

### 🌐 Browser & DOM Hooks

#### `useClipboard`
Read and write text to the user's clipboard with a temporary `copied` state.
```tsx
import { useClipboard } from "react-hook-lab";

function CopyButton() {
  const { copy, copied, error } = useClipboard(2000); // 'copied' resets after 2s
  return <button onClick={() => copy("Text to copy!")}>{copied ? "Copied!" : "Copy"}</button>;
}
```

#### `useOnlineStatus`
Detect whether the browser has an active network connection dynamically.
```tsx
import { useOnlineStatus } from "react-hook-lab";

function Status() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? "✅ Online" : "❌ Offline (Check your connection)"}</div>;
}
```

#### `useDownload`
Download JSON objects, raw strings, Blobs, or fetch remote URLs with a clean asynchronous API.
```tsx
import { useDownload } from "react-hook-lab";

function ExportData() {
  const { download, status, error } = useDownload();

  const handleExport = () => {
    // Easily download an object as a .json file
    download({ user: "Admin", data: [1, 2, 3] }, "export.json");
    
    // Or fetch a remote file automatically
    // download("https://picsum.photos/200", "image.jpg");
  };

  return (
    <div>
      <button onClick={handleExport} disabled={status === "downloading"}>
        {status === "downloading" ? "Downloading..." : "Export"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
```

#### `useNotifications`
Request OS notification permissions and dispatch native system alerts effortlessly.
```tsx
import { useNotifications } from "react-hook-lab";

function Alerts() {
  // Pass { autoRequest: false } to wait for a user gesture before prompting
  const { permission, requestPermission, sendNotification } = useNotifications();

  const notify = () => {
    if (permission !== "granted") {
      requestPermission();
    } else {
      sendNotification("Download Complete", { body: "Your export.json is ready." });
    }
  };

  return <button onClick={notify}>Enable Alerts</button>;
}
```

#### `useCamera`
Request camera permissions and easily record video or take snapshots.
```tsx
import { useCamera } from "react-hook-lab";

function Webcam() {
  const { videoRef, requestCamera, status, stop } = useCamera();
  
  return (
    <div>
      <button onClick={requestCamera}>Start Camera</button>
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}
```

#### `useMicrophone`
Request microphone permissions, monitor audio levels in real-time, and record audio.
```tsx
import { useMicrophone } from "react-hook-lab";

function AudioMonitor() {
  const { requestMicrophone, audioLevel, status } = useMicrophone();
  
  return (
    <div>
      <button onClick={requestMicrophone}>Start Mic</button>
      <div>Volume: {audioLevel}%</div>
    </div>
  );
}
```

#### `useLocation`
Securely access the user's latitude and longitude via the Geolocation API.
```tsx
import { useLocation } from "react-hook-lab";

function Map() {
  const { location, retry, status } = useLocation();
  
  if (status === "idle") return <button onClick={retry}>Get Location</button>;
  if (status === "loading") return <div>Locating...</div>;
  
  return <div>Lat: {location?.lat}, Lng: {location?.lng}</div>;
}
```

#### `useIdle`
Detect when a user has stopped interacting with your page.
```tsx
import { useIdle } from "react-hook-lab";

function InactivityWarning() {
  const isIdle = useIdle(60000); // 1 minute
  return isIdle ? <div>Are you still there?</div> : null;
}
```

#### `useClickOutside`
The standard solution for closing menus, modals, and dropdowns when a user clicks outside of them.
```tsx
import { useRef, useState } from "react";
import { useClickOutside } from "react-hook-lab";

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(true)}>Menu</button>
      {isOpen && <div className="menu-items">...</div>}
    </div>
  );
}
```

#### `useElementSize`
Track the height and width of a specific DOM element in real-time.
```tsx
import { useRef } from "react";
import { useElementSize } from "react-hook-lab";

function Box() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref);

  return <div ref={ref}>Size: {width}px x {height}px</div>;
}
```

#### `useIntersectionObserver`
Track whether a DOM element is currently visible in the viewport. Ideal for lazy loading images or infinite scrolling.
```tsx
import { useRef } from "react";
import { useIntersectionObserver } from "react-hook-lab";

function LazyImage({ src }) {
  const ref = useRef<HTMLImageElement>(null);
  const entry = useIntersectionObserver(ref, { threshold: 0.1 });
  const isVisible = !!entry?.isIntersecting;

  return <img ref={ref} src={isVisible ? src : "placeholder.jpg"} alt="Lazy loaded" />;
}
```

#### `useResizeObserver`
React to changes in a DOM element's dimensions using the native ResizeObserver API.
```tsx
import { useRef } from "react";
import { useResizeObserver } from "react-hook-lab";

function Resizable() {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useResizeObserver(ref);

  return <div ref={ref}>Width: {entry?.contentRect.width}</div>;
}
```

#### `useWidth`
Track the global inner window width dynamically.
```tsx
import { useWidth } from "react-hook-lab";

function View() {
  const width = useWidth();
  return <div>{width < 768 ? "Mobile View" : "Desktop View"}</div>;
}
```

---

### 💾 State Management Hooks

#### `useSharedState` 🚀 *(Advanced)*
A powerful hook that replaces complex global state managers (like Redux or Zustand) for simple values, while *also* syncing the state across multiple browser tabs in real-time using `BroadcastChannel`.

```tsx
import { useSharedState } from "react-hook-lab";

// Component A (Maybe in a completely different browser tab!)
function ThemeToggle() {
  const [theme, setTheme] = useSharedState("global-theme", "light");
  return <button onClick={() => setTheme("dark")}>Set Dark</button>;
}

// Component B
function App() {
  const [theme] = useSharedState("global-theme", "light");
  return <div className={`app ${theme}`}>...</div>;
}
```

#### `useLocalStorage`
Synchronize state with `localStorage`. Safely handles JSON parsing and server-side rendering hydration.
```tsx
import { useLocalStorage } from "react-hook-lab";

function Settings() {
  const [config, setConfig] = useLocalStorage("user-settings", { notifications: true });
  
  return (
    <button onClick={() => setConfig({ notifications: !config.notifications })}>
      Toggle Alerts
    </button>
  );
}
```

#### `useSessionStorage`
Synchronize state with `sessionStorage`. Survives page reloads but clears when the tab is closed.
```tsx
import { useSessionStorage } from "react-hook-lab";

function FormCache() {
  const [name, setName] = useSessionStorage("draft-name", "");
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

#### `useDeepClone`
As we all know, there wasn't a simple built-in way to clone data deeply in JavaScript without performance issues or missing features. This hook helps developers to clone data at the root level efficiently.

It works for **every data type available**: both primitives (strings, numbers, booleans) and non-primitives (deeply nested objects, arrays, Maps, Sets, Dates, and TypedArrays). It even perfectly handles complex Circular References!

Crucially for React, it guarantees a **stable memory reference** across renders if the input hasn't changed, completely fixing broken memoization.

```tsx
import { useDeepClone } from "react-hook-lab";

function HeavyComponent({ complexConfig }) {
  // If the parent passes a brand new object literal, useDeepClone intercepts it.
  // It deeply clones it, but if the content is identical to last render, 
  // it returns the exact same cached reference!
  const safeConfig = useDeepClone(complexConfig);

  useEffect(() => {
    // This effect is now perfectly stable and won't infinite loop
  }, [safeConfig]);
}
```

#### `useBoolean`
Easily manage boolean state with dedicated `on`, `off`, and `toggle` methods.
```tsx
import { useBoolean } from "react-hook-lab";

function Modal() {
  const { value: isOpen, on: open, off: close, toggle } = useBoolean(false);
  return <button onClick={toggle}>Toggle Modal</button>;
}
```

#### `useCounter`
Manage numeric state with built-in min and max bounds.
```tsx
import { useCounter } from "react-hook-lab";

function Cart() {
  const [count, { increment, decrement, reset, set }] = useCounter(1, { min: 1, max: 10 });
  return <button onClick={increment}>Add: {count}</button>;
}
```

#### `usePrevious`
Access the previous value of a state or prop after a render.
```tsx
import { useState } from "react";
import { usePrevious } from "react-hook-lab";

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);
  return <div>Now: {count}, Before: {prevCount}</div>;
}
```

#### `useToggle`
Toggle between two generic values of any type.
```tsx
import { useToggle } from "react-hook-lab";

function Mode() {
  const [mode, toggleMode] = useToggle("light", "dark");
  return <button onClick={toggleMode}>Current: {mode}</button>;
}
```

---

### 🐛 Debugging Hooks

#### `useRenderReason` 🔬 *(Advanced)*
Stop guessing why your React component is lagging or looping. Drop this hook into any component to instantly log exactly what prop, state, or **Context** changed, or if a parent triggered a "wasted render".

*Note: This hook is completely zero-overhead in production! It automatically disables itself when `process.env.NODE_ENV === 'production'` to ensure your app remains lightning fast.*

```tsx
import { useRenderReason } from "react-hook-lab";

function HeavyChart({ data, options, onPointClick }) {
  // Pass a label and an object containing the props you want to track
  useRenderReason("HeavyChart", { data, options, onPointClick });

  return <CanvasChart data={data} />;
}
```

**Console Output Examples:**
- 🟢 `[useRenderReason] HeavyChart — render #2 (14ms since last)`
- 🔴 `data: object reference changed, value unchanged. → Same content, new reference. Consider useMemo.`
- 🔵 `Context(ThemeContext): object reference changed, value unchanged. → Same content, new reference.`
- 🟡 `No tracked props/state changed — likely a wasted render triggered by a parent. Consider React.memo.`
- 🚨 `WARNING: Rendered more than expected in a short window — possible re-render loop or missing memoization.`

---

## 🌍 Browser Compatibility

- `useSharedState`: Relies on `BroadcastChannel`. Supported in all modern browsers (Chrome 54+, Firefox 38+, Safari 15.4+).
- `useClipboard`: Relies on `navigator.clipboard`. Supported in modern browsers over HTTPS.
- `useIntersectionObserver`: Relies on `IntersectionObserver`. Supported in all modern browsers.
- `useResizeObserver`: Relies on `ResizeObserver`. Supported in all modern browsers.

*Polyfills may be required for legacy environments (like Internet Explorer 11).*

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-hook`).
3. Commit your changes (`git commit -m 'feat: add amazing-hook'`).
4. Ensure tests pass (`npm run test`).
5. Push to the branch (`git push origin feature/amazing-hook`).
6. Open a Pull Request.

---
Built with ❤️ by [Saurav-TB-Pandey](https://github.com/Saurav-TB-Pandey).

### Connect with me
- [Blog](https://sauravtbpandey.blogspot.com/)
- [LinkedIn](https://www.linkedin.com/in/pandeysaurav/)
- [Dev.to](https://dev.to/saurav_tb_pandey)
