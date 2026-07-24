import { useCallback, useEffect, useRef, useState, RefObject } from "react";

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = { video: true };

export type CameraStatus = "idle" | "unsupported" | "prompting" | "granted" | "denied" | "error";

export interface UseCameraReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  status: CameraStatus;
  error: string | null;
  isRecording: boolean;
  isPreparingRecording: boolean;
  imageBlob: Blob | null;
  imageUrl: string | null;
  recordedVideoBlob: Blob | null;
  recordedVideoUrl: string | null;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: (type?: string, quality?: number) => Promise<Blob | null>;
  startRecording: () => Promise<boolean>;
  stopRecording: () => void;
  clearCapturedImage: () => void;
  clearRecordedVideo: () => void;
}

/**
 * A React hook for accessing and recording from the user's camera and microphone.
 * Supports taking picture snapshots and recording video with audio.
 * 
 * @param {MediaStreamConstraints} constraints - The media constraints to apply when requesting the camera (e.g., `{ video: true }`).
 * @returns {UseCameraReturn} An object containing stream references, state flags, recorded blobs, and control functions.
 */
export function useCamera(constraints: MediaStreamConstraints = DEFAULT_CONSTRAINTS): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingAudioStreamRef = useRef<MediaStream | null>(null);
  const recordingRequestRef = useRef(false);
  const recordedChunksRef = useRef<Blob[]>([]);
  const imageUrlRef = useRef<string | null>(null);
  const recordedVideoUrlRef = useRef<string | null>(null);

  const replaceObjectUrl = useCallback((
    urlRef: React.MutableRefObject<string | null>, 
    blob: Blob | null, 
    setUrl: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);

    const nextUrl = blob ? URL.createObjectURL(blob) : null;
    urlRef.current = nextUrl;
    setUrl(nextUrl);
  }, []);

  const requestCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setError("Camera access is not supported by this browser");
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
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError";
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "Camera access is blocked. Enable Camera in this site's browser permissions and try again."
          : err?.message || "Unable to access the camera",
      );
    }
  }, [constraints]);

  const captureImage = useCallback(
    (type = "image/jpeg", quality = 0.92): Promise<Blob | null> => {
      const video = videoRef.current;

      if (!video || video.readyState < 2 || !video.videoWidth) {
        setError("Camera preview is not ready yet");
        return Promise.resolve(null);
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        setError("Image capture is not supported by this browser");
        return Promise.resolve(null);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError("Unable to capture an image");
              resolve(null);
              return;
            }

            setImageBlob(blob);
            replaceObjectUrl(imageUrlRef, blob, setImageUrl);
            setError(null);
            resolve(blob);
          },
          type,
          quality,
        );
      });
    },
    [replaceObjectUrl],
  );

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      setError("Start the camera before recording");
      return false;
    }

    if (typeof window === "undefined" || !window.MediaRecorder) {
      setError("Video recording is not supported by this browser");
      return false;
    }

    if (recordingRequestRef.current || recorderRef.current) return false;

    recordingRequestRef.current = true;
    setIsPreparingRecording(true);
    setError(null);

    let recordingStream = streamRef.current;

    try {
      if (recordingStream.getAudioTracks().length === 0) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        recordingAudioStreamRef.current = audioStream;
        recordingStream = new MediaStream([
          ...recordingStream.getVideoTracks(),
          ...audioStream.getAudioTracks(),
        ]);
      }
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError";
      setError(
        denied
          ? "Microphone permission is required to record video with sound. Enable Microphone in this site's browser permissions and try again."
          : err?.message || "Unable to access the microphone for recording",
      );
      recordingRequestRef.current = false;
      setIsPreparingRecording(false);
      return false;
    }

    const preferredType = "video/webm;codecs=vp9";
    const mimeType = MediaRecorder.isTypeSupported(preferredType)
      ? preferredType
      : "video/webm";

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(recordingStream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType,
        });

        setRecordedVideoBlob(blob);
        replaceObjectUrl(recordedVideoUrlRef, blob, setRecordedVideoUrl);
        recordedChunksRef.current = [];
        recorderRef.current = null;
        recordingAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingAudioStreamRef.current = null;
        recordingRequestRef.current = false;
        setIsPreparingRecording(false);
        setIsRecording(false);
      };

      recorder.start();
      recordingRequestRef.current = false;
      setIsPreparingRecording(false);
      setIsRecording(true);
      setError(null);
      return true;
    } catch (err: any) {
      recordingAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingAudioStreamRef.current = null;
      recordingRequestRef.current = false;
      setIsPreparingRecording(false);
      setError(err?.message || "Unable to start video recording");
      return false;
    }
  }, [replaceObjectUrl]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopRecording();
    recordingAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingAudioStreamRef.current = null;
    recordingRequestRef.current = false;
    setIsPreparingRecording(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setStatus("idle");
    setError(null);
  }, [stopRecording]);

  const clearCapturedImage = useCallback(() => {
    setImageBlob(null);
    replaceObjectUrl(imageUrlRef, null, setImageUrl);
  }, [replaceObjectUrl]);

  const clearRecordedVideo = useCallback(() => {
    setRecordedVideoBlob(null);
    replaceObjectUrl(recordedVideoUrlRef, null, setRecordedVideoUrl);
  }, [replaceObjectUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }
      recorderRef.current = null;
      recordingAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingAudioStreamRef.current = null;
      recordingRequestRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
    };
  }, []);

  return {
    videoRef,
    stream,
    status,
    error,
    isRecording,
    isPreparingRecording,
    imageBlob,
    imageUrl,
    recordedVideoBlob,
    recordedVideoUrl,
    requestCamera,
    stopCamera,
    captureImage,
    startRecording,
    stopRecording,
    clearCapturedImage,
    clearRecordedVideo,
  };
}

export default useCamera;
