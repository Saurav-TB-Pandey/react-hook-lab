import { useDownload, type UseDownloadReturn, type DownloadStatus } from "../../src/browser";
import type { Expect, Equal, Extends } from "./type-assertions";

const dl = useDownload();
type _ReturnCheck = Expect<Equal<typeof dl, UseDownloadReturn>>;
type _StatusCheck = Expect<Equal<typeof dl.status, DownloadStatus>>;
type _StatusUnion = Expect<Extends<DownloadStatus, "idle" | "downloading" | "success" | "error">>;

// @ts-expect-error Invalid download parameter
dl.download(12345, "file.txt");
