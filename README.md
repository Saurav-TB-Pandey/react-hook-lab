# react-hook-lab

A lightweight collection of reusable React hooks for async work, browser APIs,
DOM observers, state helpers, and timers.

## Installation

```bash
npm install react-hook-lab
```

`react` is a peer dependency, so install it in your app if it is not already
there.

## Import

Import hooks from the package root:

```tsx
import {
  useDebounce,
  useAsyncDebounce,
  useWidth,
  usePrevious,
} from "react-hook-lab";
```

You can also import the default collection:

```tsx
import hooks from "react-hook-lab";

const width = hooks.useWidth();
```

## Examples

See [examples.tsx](./examples.tsx) for a single component that demonstrates all
exported hooks.

```tsx
import { useDebounce, useWidth } from "react-hook-lab";

export function SearchSummary() {
  const search = useDebounce("  hello world  ", 300);
  const width = useWidth();

  return (
    <div>
      <p>Search: {search}</p>
      <p>Window width: {width}</p>
    </div>
  );
}
```

## Hooks

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

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

`npm run build` emits the CommonJS runtime files and TypeScript declaration
files used by the npm package entrypoint.

## Publish Checklist

Before publishing:

```bash
npm run typecheck
npm run build
npm test
npm run pack:dry-run
```

Then publish:

```bash
npm login
npm publish
```

The package exposes only the root import path, so consumers should import from
`"react-hook-lab"`.
