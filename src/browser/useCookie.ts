import { useState, useCallback, useEffect, useRef } from "react";

export interface UseCookieOptions extends CookieOptions {
  /**
   * The initial rendering value used during SSR and the first client render.
   * Also used as the fallback value if the cookie is not present after hydration.
   */
  initialValue?: string;
}

/**
 * Standard configuration options for browser cookies.
 */
export interface CookieOptions {
  /** 
   * Expiration time in days from now. 
   * If `days`, `maxAgeSeconds`, and `expires` are all omitted, this automatically defaults to `7`.
   */
  days?: number;
  /** Expiration time in seconds from now. */
  maxAgeSeconds?: number;
  /** Explicit Date object specifying when the cookie expires. */
  expires?: Date;
  /** The URL path that must exist in the requested URL for the browser to send the Cookie header. Defaults to "/". */
  path?: string;
  /** The domain for which the cookie is valid. */
  domain?: string;
  /** If true, the cookie is only transmitted over secure (HTTPS) protocols. */
  secure?: boolean;
  /** Controls cross-site request behavior. 'none' requires `secure: true`. */
  sameSite?: "lax" | "strict" | "none";
}

export class CookieConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CookieConfigurationError";
  }
}

/**
 * Validates a cookie name according to RFC 6265 guidelines for characters.
 */
function isValidCookieName(name: string): boolean {
  if (!name || name.length === 0) return false;
  return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name);
}

function assertFiniteNumber(value: number | undefined, name: string): void {
  if (value !== undefined && !Number.isFinite(value)) {
    throw new CookieConfigurationError(`${name} must be a finite number`);
  }
}

function assertInteger(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isFinite(value) || !Number.isInteger(value))) {
    throw new CookieConfigurationError(`${name} must be a finite integer`);
  }
}

/**
 * Parses the current document.cookie string and extracts the value for the given key.
 */
function getCookie(key: string): string | undefined {
  if (typeof document === "undefined") return undefined;

  const pairs = document.cookie.split(";");
  for (const pair of pairs) {
    const trimmed = pair.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const cookieKey = trimmed.substring(0, separatorIndex);
    if (cookieKey === key) {
      const cookieVal = trimmed.substring(separatorIndex + 1);
      try {
        return decodeURIComponent(cookieVal);
      } catch {
        return undefined; // gracefully handle malformed URI encodings
      }
    }
  }
  return undefined;
}

/**
 * Calculates byte size of a UTF-8 string to check against browser limits.
 */
function getByteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).byteLength;
  }
  if (typeof Blob !== "undefined") {
    return new Blob([value]).size;
  }
  return encodeURIComponent(value).replace(/%[A-F\d]{2}/g, "U").length;
}

/**
 * Sets a cookie safely with all strict validations.
 * Returns true if best-effort client-side verification confirms the write.
 */
function setCookieValue(key: string, value: string, options: CookieOptions = {}): boolean {
  if (typeof document === "undefined") return false;

  if (!isValidCookieName(key)) {
    throw new CookieConfigurationError(`Invalid cookie name: "${key}"`);
  }

  assertFiniteNumber(options.days, "days");
  assertInteger(options.maxAgeSeconds, "maxAgeSeconds");

  if (options.expires !== undefined && Number.isNaN(options.expires.getTime())) {
    throw new CookieConfigurationError("expires must be a valid Date");
  }

  if (options.days !== undefined) {
    const expirationTime = Date.now() + options.days * 24 * 60 * 60 * 1000;
    if (Number.isNaN(new Date(expirationTime).getTime())) {
      throw new CookieConfigurationError("days produces an invalid expiration date");
    }
  }

  const hasDays = options.days !== undefined;
  const hasMaxAge = options.maxAgeSeconds !== undefined;
  const hasExpires = options.expires !== undefined;

  if ((hasDays && hasMaxAge) || (hasDays && hasExpires) || (hasMaxAge && hasExpires)) {
    throw new CookieConfigurationError(
      "Conflicting expiration options provided. Use only one of days, maxAgeSeconds, or expires."
    );
  }

  if (options.sameSite === "none" && options.secure !== true) {
    throw new CookieConfigurationError("sameSite: 'none' requires secure: true");
  }

  let cookieString = `${key}=${encodeURIComponent(value)}`;

  if (hasDays) {
    const date = new Date();
    date.setTime(date.getTime() + options.days! * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  } else if (hasExpires) {
    cookieString += `; expires=${options.expires!.toUTCString()}`;
  } else if (hasMaxAge) {
    cookieString += `; max-age=${options.maxAgeSeconds}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    // Default to root path to prevent fragmentation
    cookieString += `; path=/`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += `; secure`;
  }

  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }

  if (getByteLength(cookieString) > 4096) {
    throw new CookieConfigurationError("Cookie exceeds the configured 4096-byte safety limit.");
  }

  document.cookie = cookieString;

  // Best-effort client-side verification
  const verify = getCookie(key);
  return verify === value;
}

/**
 * Synchronizes state with a browser cookie.
 * Strictly string-based and completely hydration-safe.
 *
 * Note: `useCookie` does not automatically synchronize changes between multiple hook instances or browser tabs.
 * 
 * @param key - The name of the cookie (must conform to RFC 6265 token requirements).
 * @param options - Hook initialization options and default cookie configurations.
 * @param options.initialValue - The initial rendering value used during SSR and the first client render.
 * @param options.days - Expiration time in days (defaults to 7 if no other expiration is provided).
 * @param options.maxAgeSeconds - Expiration time in seconds from now.
 * @param options.expires - Explicit Date object specifying when the cookie expires.
 * @param options.path - The URL path for the cookie (defaults to "/").
 * @param options.domain - The domain for which the cookie is valid.
 * @param options.secure - If true, the cookie is only transmitted over secure (HTTPS) protocols.
 * @param options.sameSite - Controls cross-site request behavior ('lax', 'strict', or 'none').
 * @returns A tuple `[value, updateCookie, deleteCookie]`.
 */
export function useCookie(
  key: string,
  options?: UseCookieOptions
): readonly [
  string | undefined,
  (value: string, setOptions?: CookieOptions) => void,
  (deleteOptions?: Pick<CookieOptions, "path" | "domain">) => void,
] {
  // `initialValue` is used as the server/client initial rendering value and as the fallback when no cookie exists after hydration.
  const [item, setItem] = useState<string | undefined>(options?.initialValue);

  // Reconcile post-hydration
  useEffect(() => {
    const cookie = getCookie(key);
    if (cookie !== undefined) {
      setItem(cookie);
    } else {
      setItem(options?.initialValue);
    }
  }, [key, options?.initialValue]);

  // Keep the latest options in a ref to avoid stale closures in updateCookie
  // without breaking useCallback memoization if options is passed inline.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const updateCookie = useCallback(
    (value: string, setOptions?: CookieOptions) => {
      const mergedOptions: CookieOptions = { ...optionsRef.current, ...setOptions };
      
      // Default to 7 days if no expiration is specified
      if (
        mergedOptions.days === undefined && 
        mergedOptions.maxAgeSeconds === undefined && 
        mergedOptions.expires === undefined
      ) {
        mergedOptions.days = 7;
      }

      const success = setCookieValue(key, value, mergedOptions);
      if (!success) {
        throw new CookieConfigurationError(`Unable to write cookie "${key}".`);
      }
      setItem(value);
    },
    [key]
  );

  const deleteCookie = useCallback(
    (deleteOptions?: Pick<CookieOptions, "path" | "domain">) => {
      if (typeof document !== "undefined") {
        if (!isValidCookieName(key)) {
          throw new CookieConfigurationError(`Invalid cookie name: "${key}"`);
        }

        let cookieString = `${key}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        const p = deleteOptions?.path || "/";
        cookieString += `; path=${p}`;
        if (deleteOptions?.domain) {
          cookieString += `; domain=${deleteOptions.domain}`;
        }
        document.cookie = cookieString;
      }
      setItem(undefined);
    },
    [key]
  );

  return [item, updateCookie, deleteCookie] as const;
}
