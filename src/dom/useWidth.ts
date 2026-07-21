import { useEffect, useState } from "react";

/**
 * Tracks the global inner window width dynamically.
 * Automatically handles window resize events and debounces/throttles are not applied by default.
 *
 * @returns The current `window.innerWidth` in pixels.
 *
 * @example
 * ```tsx
 * const width = useWidth();
 * return <div>{width < 768 ? "Mobile" : "Desktop"}</div>;
 * ```
 */
export function useWidth(): number {
  const getWindowWidth = () => (typeof window === "undefined" ? 0 : window.innerWidth);

  const [width, setWidth] = useState(getWindowWidth);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: ReturnType<typeof window.setTimeout>;

    const handleResize = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setWidth(getWindowWidth());
      }, 150);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return width;
}
