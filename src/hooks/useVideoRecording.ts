import { useState, useRef, useCallback, useEffect } from 'react';

export type VideoRecordingState = 'idle' | 'recording' | 'stopped';

function getBestVideoMimeType(): string {
  const types = [
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

const MAX_SECONDS = 15;

export function useVideoRecording() {
  const [recordingState, setRecordingState] = useState<VideoRecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    return () => {
      startedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    setError(null);
    setVideoBlob(null);
    setElapsedSeconds(0);
    chunksRef.current = [];

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);

      const detectedMime = getBestVideoMimeType();
      setMimeType(detectedMime || 'video/webm');
      const recorder = new MediaRecorder(mediaStream, detectedMime ? { mimeType: detectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: detectedMime || 'video/webm',
        });
        setVideoBlob(blob);
        setRecordingState('stopped');
        mediaStream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setRecordingState('recording');

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);

      autoStopRef.current = setTimeout(() => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        recorder.stop();
      }, MAX_SECONDS * 1000);
    } catch (err) {
      startedRef.current = false;
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow access in your browser settings.');
        } else {
          setError('Could not start video recording. Please try again.');
        }
      }
      setRecordingState('idle');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    startedRef.current = false;
    setRecordingState('idle');
    setElapsedSeconds(0);
    setVideoBlob(null);
    setStream(null);
    setError(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, []);

  return {
    recordingState,
    elapsedSeconds,
    maxSeconds: MAX_SECONDS,
    videoBlob,
    mimeType,
    stream,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
