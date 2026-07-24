import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = { audio: true };
const AUDIO_THROTTLE_MS = 100;

export type MicrophoneStatus = "idle" | "unsupported" | "prompting" | "granted" | "denied" | "error";

export interface UseMicrophoneReturn {
  stream: MediaStream | null;
  status: MicrophoneStatus;
  error: string | null;
  audioLevel: number;
  isRecording: boolean;
  recordedAudioBlob: Blob | null;
  recordedAudioUrl: string | null;
  requestMicrophone: () => Promise<void>;
  stopMicrophone: () => void;
  startRecording: () => boolean;
  stopRecording: () => void;
  clearRecording: () => void;
}

/**
 * A React hook for accessing, monitoring, and recording from the user's microphone.
 * Provides real-time audio volume levels (throttled to 10fps for performance) and audio recording functionality.
 * 
 * @param {MediaStreamConstraints} constraints - The media constraints to apply when requesting the microphone (e.g., `{ audio: true }`).
 * @returns {UseMicrophoneReturn} An object containing the audio stream, volume level, recording blobs, and control functions.
 */
export function useMicrophone(constraints: MediaStreamConstraints = DEFAULT_CONSTRAINTS): UseMicrophoneReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<MicrophoneStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedAudioUrlRef = useRef<string | null>(null);
  const lastAudioUpdateRef = useRef<number>(0);

  const stopMonitoring = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const monitorAudioLevel = useCallback(
    (mediaStream: MediaStream) => {
      stopMonitoring();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        setAudioLevel(0);
        return;
      }

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const now = performance.now();
        // Throttle React state updates to avoid rendering 60 times a second
        if (now - lastAudioUpdateRef.current >= AUDIO_THROTTLE_MS) {
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(Math.round((average / 255) * 100));
          lastAudioUpdateRef.current = now;
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    [stopMonitoring],
  );

  const requestMicrophone = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("Microphone access is not supported by this browser");
      return;
    }

    setStatus("prompting");
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus("granted");
      monitorAudioLevel(mediaStream);
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError";
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "Microphone access is blocked. Enable Microphone in this site's browser permissions and try again."
          : err?.message || "Unable to access the microphone",
      );
    }
  }, [constraints, monitorAudioLevel]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError("Start the microphone before recording");
      return false;
    }

    if (typeof window === "undefined" || !window.MediaRecorder) {
      setError("Audio recording is not supported by this browser");
      return false;
    }

    if (recorderRef.current) return false;

    const supportedType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ].find((type) => MediaRecorder.isTypeSupported(type));

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(
        streamRef.current,
        supportedType ? { mimeType: supportedType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType,
        });

        if (recordedAudioUrlRef.current) {
          URL.revokeObjectURL(recordedAudioUrlRef.current);
        }

        const nextUrl = URL.createObjectURL(blob);
        recordedAudioUrlRef.current = nextUrl;
        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(nextUrl);
        recordedChunksRef.current = [];
        recorderRef.current = null;
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
      return true;
    } catch (err: any) {
      recorderRef.current = null;
      setError(err?.message || "Unable to start audio recording");
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (recordedAudioUrlRef.current) {
      URL.revokeObjectURL(recordedAudioUrlRef.current);
      recordedAudioUrlRef.current = null;
    }

    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
  }, []);

  const stopMicrophone = useCallback(() => {
    stopRecording();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    stopMonitoring();
    setStream(null);
    setStatus("idle");
    setError(null);
    setAudioLevel(0);
  }, [stopMonitoring, stopRecording]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      stopMonitoring();
      if (recordedAudioUrlRef.current) {
        URL.revokeObjectURL(recordedAudioUrlRef.current);
      }
    };
  }, [stopMonitoring]);

  return {
    stream,
    status,
    error,
    audioLevel,
    isRecording,
    recordedAudioBlob,
    recordedAudioUrl,
    requestMicrophone,
    stopMicrophone,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

export default useMicrophone;
