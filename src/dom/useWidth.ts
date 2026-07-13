import { useEffect, useState } from "react";

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
