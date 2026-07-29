import { useState, useEffect, useRef, useMemo } from "react";

/**
 * Represents a single breadcrumb segment generated from the URL path.
 */
export interface Breadcrumb {
  /** The capitalized name of the path segment (e.g., "Products") */
  name: string;
  /** The absolute path leading up to this segment (e.g., "/products") */
  path: string;
}

/**
 * The complete parsed representation of the current browser URL.
 */
export interface UseURLReturn {
  /** The full URL string (e.g., "https://example.com/path?q=1") */
  href: string;
  /** The protocol, including the colon (e.g., "https:") */
  protocol: string;
  /** The host, including port if present (e.g., "example.com:8080") */
  host: string;
  /** The hostname, excluding port (e.g., "example.com") */
  hostname: string;
  /** The port number as a string (e.g., "8080"), or empty string if default */
  port: string;
  /** The path component of the URL (e.g., "/products/mobile") */
  pathname: string;
  /** The hash fragment, including the hash symbol (e.g., "#preview") */
  hash: string;
  /** The query string, including the question mark (e.g., "?page=2") */
  search: string;
  /** The URL origin (e.g., "https://example.com") */
  origin: string;
  /** An object containing parsed query parameters. Duplicate keys form arrays. */
  query: Record<string, string | string[]>;
  /** The path split into an array of segments (e.g., ["products", "mobile"]) */
  segments: string[];
  /** The detected filename without extension, if present (e.g., "image") */
  filename: string | null;
  /** The detected file extension, if present (e.g., "png") */
  extension: string | null;
  /** The parent directory path (e.g., "/products") */
  parent: string;
  /** The depth level of the current path (number of segments) */
  depth: number;
  /** The pathname of the previous URL before the last navigation, or null if initial */
  previous: string | null;
  /** True if the user has navigated away from the previous path in this session */
  changed: boolean;
  /** True if the current pathname is the root ("/") */
  isHome: boolean;
  /** True if the protocol is "https:" */
  isSecure: boolean;
  /** Reserved for future cross-domain navigation checks */
  isExternal: boolean;
  /** An array of progressively built breadcrumbs up to the current path */
  breadcrumbs: Breadcrumb[];
  /** A timestamp (ms) of exactly when the URL last changed */
  timestamp: number;
}

// SSR Safe Defaults
const DEFAULT_URL: UseURLReturn = {
  href: "",
  protocol: "",
  host: "",
  hostname: "",
  port: "",
  pathname: "",
  hash: "",
  search: "",
  origin: "",
  query: {},
  segments: [],
  filename: null,
  extension: null,
  parent: "",
  depth: 0,
  previous: null,
  changed: false,
  isHome: true,
  isSecure: false,
  isExternal: false,
  breadcrumbs: [{ name: "Home", path: "/" }],
  timestamp: 0,
};

// Pure Parsers
/**
 * Parses a raw query string into a key-value object.
 * Handles arrays for duplicate keys automatically.
 * @param search - The raw query string (e.g., "?page=1&tags=a&tags=b")
 * @returns An object map of the query parameters
 */
function parseQuery(search: string): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  if (!search || search === "?") return query;

  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    if (query[key] !== undefined) {
      if (Array.isArray(query[key])) {
        (query[key] as string[]).push(value);
      } else {
        query[key] = [query[key] as string, value];
      }
    } else {
      query[key] = value;
    }
  });
  return query;
}

/**
 * Splits a pathname into an array of non-empty segments.
 * @param pathname - The path string (e.g., "/products/shoes")
 * @returns An array of string segments (e.g., ["products", "shoes"])
 */
function parseSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/**
 * Progressively builds an array of breadcrumb objects from path segments.
 * @param segments - The array of parsed path segments
 * @returns An array of `Breadcrumb` objects starting from Home
 */
function buildBreadcrumbs(segments: string[]): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [{ name: "Home", path: "/" }];
  let currentPath = "";

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: currentPath,
    });
  });

  return breadcrumbs;
}

/**
 * The master parsing function that shreds a raw URL string into the complete `UseURLReturn` structure.
 * Guaranteed not to throw; falls back to default empty fields if the URL is completely invalid.
 * @param href - The full URL string to parse
 * @returns The parsed URL object omitting react-specific tracking metadata
 */
function parseURL(href: string): Omit<UseURLReturn, "previous" | "changed" | "timestamp"> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { ...DEFAULT_URL } as any;
  }

  const segments = parseSegments(url.pathname);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : "";
  let filename: string | null = null;
  let extension: string | null = null;

  if (lastSegment && lastSegment.includes(".") && !lastSegment.startsWith(".")) {
    const parts = lastSegment.split(".");
    extension = parts.pop() || null;
    filename = parts.join(".");
  }

  const parent =
    segments.length > 1 ? "/" + segments.slice(0, -1).join("/") : segments.length === 1 ? "/" : "";

  return {
    href: url.href,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    hash: url.hash,
    search: url.search,
    origin: url.origin,
    query: parseQuery(url.search),
    segments,
    filename,
    extension,
    parent,
    depth: segments.length,
    isHome: url.pathname === "/",
    isSecure: url.protocol === "https:",
    isExternal: false,
    breadcrumbs: buildBreadcrumbs(segments),
  };
}

// Setup Event Patches
let isPatched = false;
function setupHistoryListeners() {
  if (typeof window === "undefined" || isPatched) return;
  isPatched = true;

  const originalPush = window.history.pushState;
  const originalReplace = window.history.replaceState;

  window.history.pushState = function (...args) {
    const result = originalPush.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
    return result;
  };

  window.history.replaceState = function (...args) {
    const result = originalReplace.apply(this, args);
    window.dispatchEvent(new Event("replacestate"));
    return result;
  };
}

/**
 * A highly optimized hook that provides complete, deeply-parsed information about the current browser URL.
 * It automatically reacts to programmatic navigation (pushState/replaceState),
 * back/forward buttons (popstate), and hash changes without needing an external routing library.
 * It is fully SSR safe and highly optimized with `useMemo` to prevent unnecessary downstream re-renders.
 *
 * @returns {UseURLReturn} A stable object containing the parsed URL data and navigation metadata.
 *
 * @example
 * ```tsx
 * const { pathname, query, segments, changed, previous } = useURL();
 *
 * console.log(pathname); // "/products/shoes"
 * console.log(query.page); // "2"
 * console.log(segments[0]); // "products"
 * ```
 */
export function useURL(): UseURLReturn {
  const [rawHref, setRawHref] = useState(() =>
    typeof window !== "undefined" ? window.location.href : ""
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setupHistoryListeners();

    const handleURLChange = () => {
      setRawHref(window.location.href);
    };

    window.addEventListener("popstate", handleURLChange);
    window.addEventListener("pushstate", handleURLChange);
    window.addEventListener("replacestate", handleURLChange);
    window.addEventListener("hashchange", handleURLChange);

    return () => {
      window.removeEventListener("popstate", handleURLChange);
      window.removeEventListener("pushstate", handleURLChange);
      window.removeEventListener("replacestate", handleURLChange);
      window.removeEventListener("hashchange", handleURLChange);
    };
  }, []);

  const parsed = useMemo(() => {
    if (!rawHref) return null;
    return parseURL(rawHref);
  }, [rawHref]);

  // Track navigation history strictly based on pathname changes without causing loops
  const prevPathRef = useRef<string | null>(null);
  const currentPathRef = useRef<string | null>(parsed?.pathname || null);
  // eslint-disable-next-line
  const timestampRef = useRef<number>(typeof window !== "undefined" ? Date.now() : 0);

  if (parsed && parsed.pathname !== currentPathRef.current) {
    prevPathRef.current = currentPathRef.current;
    currentPathRef.current = parsed.pathname;
    // eslint-disable-next-line
    timestampRef.current = Date.now();
  }

  return useMemo(() => {
    if (!parsed) return DEFAULT_URL;

    return {
      ...parsed,
      previous: prevPathRef.current,
      changed: prevPathRef.current !== null && prevPathRef.current !== parsed.pathname,
      timestamp: timestampRef.current,
    };
  }, [parsed]); // Native useMemo is safe here because 'parsed' is referentially stable if rawHref hasn't changed.
}
