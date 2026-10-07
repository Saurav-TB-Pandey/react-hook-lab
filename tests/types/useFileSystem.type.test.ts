import { useFileSystem, type UseFileSystemReturn, type FileSystemStatus } from "../../src/browser";
import type { Expect, Equal, Extends } from "./type-assertions";

const fs = useFileSystem({ accept: { "text/plain": [".txt"] } });
type _ReturnCheck = Expect<Equal<typeof fs, UseFileSystemReturn>>;
type _StatusCheck = Expect<Equal<typeof fs.status, FileSystemStatus>>;
type _ContentCheck = Expect<Equal<typeof fs.content, string | null>>;

// @ts-expect-error Invalid option property
useFileSystem({ invalidOption: true });
