import { useMicrophone, type UseMicrophoneReturn, type MicrophoneStatus } from "../../src/browser";
import type { Expect, Equal } from "./type-assertions";

const mic = useMicrophone({ audio: true });
type _ReturnCheck = Expect<Equal<typeof mic, UseMicrophoneReturn>>;
type _StatusCheck = Expect<Equal<typeof mic.status, MicrophoneStatus>>;
type _AudioLevel = Expect<Equal<typeof mic.audioLevel, number>>;

// @ts-expect-error Constraints must be MediaStreamConstraints
useMicrophone("invalid");
