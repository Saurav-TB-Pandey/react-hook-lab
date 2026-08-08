import { useCallback, useState } from "react";

// --- Minimal File System Access API Type Definitions ---
// These ensure we don't break strict TypeScript projects that lack these bleeding-edge types.

interface FileSystemWritableFileStream {
  write(data: string | ArrayBuffer | ArrayBufferView | Blob): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
  close(): Promise<void>;
}

export interface FileSystemFileHandle {
  readonly kind: "file";
  readonly name: string;
  isSameEntry(other: FileSystemFileHandle): Promise<boolean>;
  getFile(): Promise<File>;
  createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
}

interface ShowOpenFilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

interface ShowSaveFilePickerOptions {
  excludeAcceptAllOption?: boolean;
  suggestedName?: string;
  types?: {
    description?: string;
    accept: Record<string, string[]>;
  }[];
}

declare global {
  interface Window {
    showOpenFilePicker?(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

// --- Hook Interfaces ---

export interface UseFileSystemOptions {
  /** Map of MIME types to array of extensions, e.g. { 'text/plain': ['.txt', '.md'] } */
  accept?: Record<string, string[]>;
  /** Description for the file types, e.g. "Text Files" */
  description?: string;
}

export interface UseFileSystemSaveAsOptions extends UseFileSystemOptions {
  suggestedName?: string;
}

export type FileSystemStatus = "idle" | "picking" | "reading" | "saving" | "error";

export interface UseFileSystemReturn {
  /** True if the File System Access API is supported in the current browser */
  isSupported: boolean;
  /** Current state of the file system operation */
  status: FileSystemStatus;
  /** The current native File object containing metadata (name, size, lastModified) */
  file: File | null;
  /** The internal FileSystemFileHandle used to write to the file */
  handle: FileSystemFileHandle | null;
  /** The text content of the file */
  content: string | null;
  /** Any error encountered during the operation */
  error: Error | null;
  /** Prompts the user to pick a file to open */
  open: (options?: UseFileSystemOptions) => Promise<void>;
  /** Saves data directly back to the currently opened file */
  save: (newContent: string | Blob, options?: UseFileSystemSaveAsOptions) => Promise<void>;
  /** Prompts the user to pick a location to save a new file */
  saveAs: (newContent: string | Blob, options?: UseFileSystemSaveAsOptions) => Promise<void>;
  /** Clears the current file, content, and errors */
  reset: () => void;
}

/**
 * A hook that utilizes the modern File System Access API to interact with local files on the user's hard drive.
 * Provides the ability to open, read, and continually save changes to a file without prompting for re-download.
 *
 * @param {UseFileSystemOptions} [defaultOptions] - Optional default configuration for file pickers (e.g., accepted MIME types).
 * @returns {UseFileSystemReturn} An object containing the file state, content, and methods to open/save files.
 *
 * @example
 * ```tsx
 * const { open, save, content, status } = useFileSystem({ accept: { 'text/plain': ['.txt'] } });
 *
 * return (
 *   <div>
 *     <button onClick={() => open()}>Open File</button>
 *     <button onClick={() => save('New content!')}>Save Changes</button>
 *     <p>File content: {content}</p>
 *   </div>
 * );
 * ```
 */
export function useFileSystem(defaultOptions?: UseFileSystemOptions): UseFileSystemReturn {
  const isSupported =
    typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";

  const [status, setStatus] = useState<FileSystemStatus>("idle");
  const [handle, setHandle] = useState<FileSystemFileHandle | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const formatOptions = useCallback(
    (options?: UseFileSystemOptions) => {
      const merged = { ...defaultOptions, ...options };
      if (!merged.accept) return undefined;
      return [
        {
          description: merged.description || "Files",
          accept: merged.accept,
        },
      ];
    },
    [defaultOptions]
  );

  const open = useCallback(
    async (options?: UseFileSystemOptions) => {
      if (!isSupported) {
        setError(new Error("File System Access API is not supported in this browser."));
        return;
      }
      try {
        setError(null);
        setStatus("picking");
        const handles = await window.showOpenFilePicker!({
          multiple: false,
          types: formatOptions(options),
        });

        const activeHandle = handles[0];
        setStatus("reading");

        const activeFile = await activeHandle.getFile();
        const textContent = await activeFile.text();

        setHandle(activeHandle);
        setFile(activeFile);
        setContent(textContent);
        setStatus("idle");
      } catch (err: unknown) {
        // AbortError is thrown when the user closes the picker without selecting a file.
        // We shouldn't treat this as an error.
        if (
          (err as Error).name === "AbortError" ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          setStatus("idle");
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [isSupported, formatOptions]
  );

  const saveAs = useCallback(
    async (newContent: string | Blob, options?: UseFileSystemSaveAsOptions) => {
      if (!isSupported) {
        setError(new Error("File System Access API is not supported in this browser."));
        return;
      }
      try {
        setError(null);
        setStatus("picking");

        const newHandle = await window.showSaveFilePicker!({
          suggestedName: options?.suggestedName,
          types: formatOptions(options),
        });

        setStatus("saving");
        const writable = await newHandle.createWritable();
        await writable.write(newContent);
        await writable.close();

        const newFile = await newHandle.getFile();

        setHandle(newHandle);
        setFile(newFile);
        if (typeof newContent === "string") {
          setContent(newContent);
        }

        setStatus("idle");
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [isSupported, formatOptions]
  );

  const save = useCallback(
    async (newContent: string | Blob, options?: UseFileSystemSaveAsOptions) => {
      if (!handle) {
        return saveAs(newContent, { suggestedName: "untitled", ...options });
      }
      try {
        setError(null);
        setStatus("saving");

        const writable = await handle.createWritable();
        await writable.write(newContent);
        await writable.close();

        // Refresh the file metadata after saving
        const updatedFile = await handle.getFile();
        setFile(updatedFile);

        // If the content is a string, update our local content state immediately.
        // If it's a Blob, we'd have to read it back, but usually text editors deal with strings.
        if (typeof newContent === "string") {
          setContent(newContent);
        }

        setStatus("idle");
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      }
    },
    [handle, saveAs]
  );

  const reset = useCallback(() => {
    setHandle(null);
    setFile(null);
    setContent(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    isSupported,
    status,
    file,
    handle,
    content,
    error,
    open,
    save,
    saveAs,
    reset,
  };
}
