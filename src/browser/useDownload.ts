import { useCallback, useState } from "react";

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Allow the browser to process the click before releasing the Blob URL.
  // 150ms is safer than 0ms to ensure the OS download manager has hooked into the blob.
  setTimeout(() => URL.revokeObjectURL(url), 150);
}

export interface UseDownloadOptions {
  mimeType?: string;
  fetchOptions?: RequestInit;
}

export type DownloadStatus = "idle" | "downloading" | "success" | "error";

export interface UseDownloadReturn {
  status: DownloadStatus;
  error: string | null;
  download: (
    source: Blob | string | object,
    filename: string,
    options?: UseDownloadOptions
  ) => Promise<boolean>;
}

/**
 * Downloads a Blob, plain string, JSON-serializable object, or remote URL.
 * It dynamically handles fetching remote/relative URLs or generating text/JSON blobs on the fly.
 *
 * @returns Object containing the current download `status`, any `error` message, and the `download` execution function.
 *
 * @example
 * ```tsx
 * const { download, status } = useDownload();
 *
 * const handleExport = () => {
 *   download({ key: "value" }, "export.json");
 * };
 *
 * return <button onClick={handleExport}>{status === "downloading" ? "Exporting..." : "Export JSON"}</button>;
 * ```
 */
export function useDownload(): UseDownloadReturn {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (source: Blob | string | object, filename: string, options: UseDownloadOptions = {}) => {
      setStatus("downloading");
      setError(null);

      try {
        if (typeof window === "undefined" || typeof document === "undefined") {
          throw new Error("Downloads are only available in a browser");
        }

        if (typeof filename !== "string" || !filename.trim()) {
          throw new Error("A filename is required");
        }

        let blob: Blob;

        if (source instanceof Blob) {
          blob = source;
        } else if (
          typeof source === "string" &&
          (/^https?:\/\//i.test(source) || source.startsWith("/"))
        ) {
          const response = await fetch(source, options.fetchOptions);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          blob = await response.blob();
        } else if (typeof source === "string") {
          blob = new Blob([source], {
            type: options.mimeType || "text/plain;charset=utf-8",
          });
        } else if (source !== null && typeof source === "object") {
          blob = new Blob([JSON.stringify(source, null, 2)], {
            type: options.mimeType || "application/json;charset=utf-8",
          });
        } else {
          throw new Error("Unsupported data type passed to download()");
        }

        triggerBlobDownload(blob, filename.trim());
        setStatus("success");
        return true;
      } catch (downloadError: any) {
        setStatus("error");
        setError(downloadError?.message || "Unable to download the file");
        return false;
      }
    },
    []
  );

  return { status, error, download };
}
