# react-hook-lab

[![npm version](https://img.shields.io/npm/v/react-hook-lab.svg)](https://www.npmjs.com/package/react-hook-lab)
[![npm downloads](https://img.shields.io/npm/dt/react-hook-lab.svg)](https://www.npmjs.com/package/react-hook-lab)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=Saurav-TB-Pandey.react-hook-lab)

A lightweight collection of reusable React hooks for async work, browser APIs, DOM observers, state helpers, and timers. Written in TypeScript.

## Installation

```bash
npm install react-hook-lab
```

`react` is a peer dependency, so install it in your app if it is not already there.

## Import

Import hooks from the package root:

```tsx
import {
  useDebounce,
  useLocalStorage,
  useWidth,
} from "react-hook-lab";
```

You can also import the default collection:

```tsx
import hooks from "react-hook-lab";

const width = hooks.useWidth();
```

## Features

- **TypeScript Ready**: Built with TypeScript for full type safety.
- **Lightweight**: Zero dependencies (only `react` as a peer dependency).
- **Tree-shakable**: Exported individually for modern bundlers.

## Quick Examples

### State: `useLocalStorage`
```tsx
import { useLocalStorage } from "react-hook-lab";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Toggle to {theme === "light" ? "dark" : "light"} theme
    </button>
  );
}
```

### DOM: `useClickOutside`
```tsx
import { useRef, useState } from "react";
import { useClickOutside } from "react-hook-lab";

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref}>
      <button onClick={() => setIsOpen(true)}>Open Menu</button>
      {isOpen && <div>Menu Content</div>}
    </div>
  );
}
```

## Available Hooks

### Async
- `useDebounce(value, delay?, options?)`
- `useThrottle(value, delay?, options?)`
- `useAsync(asyncFunction, dependencies?, options?)`
- `useAsyncDebounce(callback, delay?)`

### Browser
- `useClipboard(timeout?)`
- `useLocalStorage(key, initialValue)`
- `useSessionStorage(key, initialValue)`
- `useOnlineStatus()`

### DOM
- `useClickOutside(ref, handler, options?)`
- `useIntersectionObserver(ref, options?)`
- `useResizeObserver(ref, options?)`
- `useElementSize(ref)`
- `useWidth()`

### State
- `useBoolean(initialValue?)`
- `useCounter(initialValue?, options?)`
- `usePrevious(value, defaultValue?)`
- `useToggle(defaultValue, reverseValue?)`

### Time
- `useTimeout(callback, delay)`
- `useInterval(callback, delay)`

See [examples.tsx](./examples.tsx) for a single component that demonstrates all exported hooks.

