import { useCamera, type UseCameraReturn, type CameraStatus } from "../../src/browser";
import type { Expect, Equal, Extends } from "./type-assertions";

const camera = useCamera({ video: true, audio: false });
type _ReturnCheck = Expect<Equal<typeof camera, UseCameraReturn>>;
type _StatusCheck = Expect<Equal<typeof camera.status, CameraStatus>>;
type _StatusUnion = Expect<Extends<CameraStatus, "idle" | "unsupported" | "prompting" | "granted" | "denied" | "error">>;

// @ts-expect-error Constraints must be MediaStreamConstraints
useCamera(12345);
