# react-hook-lab

[![npm version](https://img.shields.io/npm/v/react-hook-lab.svg)](https://www.npmjs.com/package/react-hook-lab)
[![npm downloads](https://img.shields.io/npm/dt/react-hook-lab.svg)](https://www.npmjs.com/package/react-hook-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-hook-lab)](https://bundlephobia.com/package/react-hook-lab)
![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=Saurav-TB-Pandey.react-hook-lab)

A lightweight collection of reusable React hooks for async work, browser APIs, DOM observers, state helpers, and timers. Written completely in TypeScript.

## Table of Contents
- [Installation](#installation)
- [Hooks Overview](#hooks-overview)
- [API Documentation](#api-documentation)
  - [Async Hooks](#async-hooks)
  - [Browser Hooks](#browser-hooks)
  - [DOM Hooks](#dom-hooks)
  - [State Hooks](#state-hooks)
  - [Time Hooks](#time-hooks)
- [Browser Compatibility](#browser-compatibility)

## Installation

```bash
npm install react-hook-lab
```

`react` is a peer dependency, so install it in your app if it is not already there.

## Hooks Overview

| Hook | Category | Description |
|------|----------|-------------|
| `useAsync` | Async | Resolve promises with state tracking (loading, error, value). |
| `useAsyncDebounce` | Async | Debounce an asynchronous callback. |
| `useDebounce` | Async | Delay state updates by a given time. |
| `useThrottle` | Async | Limit the rate at which a state can update. |
| `useClipboard` | Browser | Read and write text to the user's clipboard. |
| `useLocalStorage` | Browser | Persist state in `localStorage`. |
| `useSessionStorage` | Browser | Persist state in `sessionStorage`. |
| `useOnlineStatus` | Browser | Track the browser's online/offline network status. |
| `useClickOutside` | DOM | Detect clicks outside a specified element. |
| `useElementSize` | DOM | Track the width and height of an HTML element. |
| `useIntersectionObserver` | DOM | Detect visibility of an element on screen. |
| `useResizeObserver` | DOM | Track an element's dimensions as it resizes. |
| `useWidth` | DOM | Track the global window inner width. |
| `useBoolean` | State | Manage a boolean state with specific methods (on, off, toggle). |
| `useCounter` | State | Manage a numeric counter with min/max bounds. |
| `usePrevious` | State | Store the previous value of a state or prop. |
| `useToggle` | State | Toggle between two generic values. |
| `useInterval` | Time | Set up a declarative `setInterval` that cleans up properly. |
| `useTimeout` | Time | Set up a declarative `setTimeout` that cleans up properly. |

## API Documentation

### Async Hooks

#### `useAsync`
Execute a promise-returning function and track its loading state, value, and any errors.

```tsx
import { useAsync } from "react-hook-lab";

function UserProfile({ userId }) {
  const { execute, status, value, error } = useAsync(
    () => fetch(`/api/users/${userId}`).then(res => res.json()),
    [userId]
  );

  if (status === "pending") return <div>Loading...</div>;
  if (status === "error") return <div>Error: {error.message}</div>;
  return <div>{value?.name}</div>;
}
```

#### `useDebounce`
Debounce a fast-changing value. The debounced value will only reflect the latest value after the specified delay has passed.

```tsx
import { useState } from "react";
import { useDebounce } from "react-hook-lab";

function SearchInput() {
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounce(term, 500);

  // 'debouncedTerm' updates 500ms after the user stops typing
  return <input value={term} onChange={(e) => setTerm(e.target.value)} />;
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
  // throttledScroll will update maximally once every 200ms
}
```

#### `useAsyncDebounce`
Debounce an asynchronous callback. Useful for preventing spam API calls.

```tsx
import { useAsyncDebounce } from "react-hook-lab";

function Example() {
  const fetchAutocomplete = useAsyncDebounce(async (query) => {
    return await api.get(`/search?q=${query}`);
  }, 300);
}
```

### Browser Hooks

#### `useClipboard`
Copy text to the clipboard and temporarily display a copied state.

```tsx
import { useClipboard } from "react-hook-lab";

function CopyButton() {
  const { copy, copied, error } = useClipboard(2000); // Reset 'copied' after 2s

  return (
    <button onClick={() => copy("Text to copy!")}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
```

#### `useLocalStorage`
Synchronize state with `localStorage`.

```tsx
import { useLocalStorage } from "react-hook-lab";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  return <button onClick={() => setTheme("dark")}>Dark Mode</button>;
}
```

#### `useSessionStorage`
Synchronize state with `sessionStorage`.

```tsx
import { useSessionStorage } from "react-hook-lab";

function FormCache() {
  const [name, setName] = useSessionStorage("form-name", "");
  return <input value={name} onChange={e => setName(e.target.value)} />;
}
```

#### `useOnlineStatus`
Detect whether the browser has an active network connection.

```tsx
import { useOnlineStatus } from "react-hook-lab";

function Status() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? "✅ Online" : "❌ Offline"}</div>;
}
```

### DOM Hooks

#### `useClickOutside`
Trigger a callback when the user clicks outside a specific DOM element.

```tsx
import { useRef, useState } from "react";
import { useClickOutside } from "react-hook-lab";

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(true)}>Open Menu</button>
      {isOpen && <div>Menu Content</div>}
    </div>
  );
}
```

#### `useElementSize`
Track the height and width of a specific DOM element.

```tsx
import { useRef } from "react";
import { useElementSize } from "react-hook-lab";

function ResizeBox() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref);
  
  return <div ref={ref}>Size: {width}px x {height}px</div>;
}
```

#### `useIntersectionObserver`
Track whether a DOM element is currently visible in the viewport.

```tsx
import { useRef } from "react";
import { useIntersectionObserver } from "react-hook-lab";

function LazyImage() {
  const ref = useRef<HTMLImageElement>(null);
  const entry = useIntersectionObserver(ref, { threshold: 0.5 });
  const isVisible = !!entry?.isIntersecting;

  return <img ref={ref} src={isVisible ? "real.jpg" : "placeholder.jpg"} />;
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
Track the global inner window width.

```tsx
import { useWidth } from "react-hook-lab";

function View() {
  const width = useWidth();
  return <div>{width < 768 ? "Mobile" : "Desktop"}</div>;
}
```

### State Hooks

#### `useBoolean`
Easily manage boolean state with dedicated `on`, `off`, and `toggle` methods.

```tsx
import { useBoolean } from "react-hook-lab";

function Modal() {
  const { value: isOpen, on: open, off: close, toggle } = useBoolean(false);
  // ...
}
```

#### `useCounter`
Manage numeric state with built-in min and max bounds.

```tsx
import { useCounter } from "react-hook-lab";

function Cart() {
  const [count, { increment, decrement, reset }] = useCounter(1, { min: 1, max: 10 });
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
Toggle between two values of any type.

```tsx
import { useToggle } from "react-hook-lab";

function Mode() {
  const [mode, toggleMode] = useToggle("light", "dark");
  return <button onClick={toggleMode}>Current: {mode}</button>;
}
```

### Time Hooks

#### `useInterval`
A declarative `setInterval` hook that handles cleanup and React's closure staleness issues.

```tsx
import { useState } from "react";
import { useInterval } from "react-hook-lab";

function Clock() {
  const [time, setTime] = useState(0);

  // Set delay to `null` to pause the interval
  useInterval(() => setTime(t => t + 1), 1000);
}
```

#### `useTimeout`
A declarative `setTimeout` hook.

```tsx
import { useState } from "react";
import { useTimeout } from "react-hook-lab";

function AutoCloseMessage() {
  const [show, setShow] = useState(true);

  useTimeout(() => setShow(false), 5000);
  
  if (!show) return null;
  return <div>This will disappear in 5 seconds!</div>;
}
```

## Browser Compatibility

- `useClipboard`: Relies on `navigator.clipboard`. Supported in all modern browsers over HTTPS.
- `useIntersectionObserver`: Relies on `IntersectionObserver`. Supported in all modern browsers.
- `useResizeObserver`: Relies on `ResizeObserver`. Supported in all modern browsers.

Polyfills may be required for older browsers like Internet Explorer 11.
