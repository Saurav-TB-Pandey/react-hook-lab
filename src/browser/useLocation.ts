import { useCallback, useEffect, useState } from "react";

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

export type LocationStatus = "idle" | "unsupported" | "prompting" | "granted" | "denied" | "error";

export interface UseLocationReturn {
  location: LocationData | null;
  status: LocationStatus;
  error: string | null;
  retry: () => void;
}

/**
 * A React hook that accesses the browser's Geolocation API.
 * Automatically tracks permission changes and safely handles missing hardware.
 * 
 * @returns {UseLocationReturn} An object containing the current location, status, error message, and a retry function.
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Geolocation is not supported by this browser");
      return;
    }

    setStatus("prompting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus("granted");
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError(
            "Location access is blocked. Enable Location in this site's browser permissions, then click Retry location.",
          );
          return;
        }

        setStatus("error");
        setError(err.message || "Unable to retrieve your location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    let permissionStatus: PermissionStatus | undefined;
    let active = true;

    const syncPermission = () => {
      if (!active || !permissionStatus) return;

      if (permissionStatus.state === "granted") {
        requestLocation();
      } else if (permissionStatus.state === "denied") {
        setStatus("denied");
        setError(
          "Location access is blocked. Enable Location in this site's browser permissions, then click Retry location.",
        );
      }
    };

    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (!active) return;

          permissionStatus = result;

          if (result.state === "granted" || result.state === "prompt") {
            requestLocation();
          } else {
            setStatus("denied");
            setError(
              "Location access is blocked. Enable Location in this site's browser permissions, then click Retry location.",
            );
          }

          result.addEventListener("change", syncPermission);
        })
        .catch(() => {
          if (active) requestLocation();
        });
    } else {
      requestLocation();
    }

    return () => {
      active = false;
      permissionStatus?.removeEventListener("change", syncPermission);
    };
  }, [requestLocation]);

  return { location, status, error, retry: requestLocation };
}

export default useLocation;
