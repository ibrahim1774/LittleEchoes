import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'stopped';

function getBestMimeType(): string {
  const types = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function useRecording(maxSeconds = 60) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store stream in a ref for cleanup — avoids the effect re-running when stream state changes
  const streamRef = useRef<MediaStream | null>(null);
  // Guard against React StrictMode double-invoking startRecording via useEffect
  const startedRef = useRef(false);

  // Single unmount-only cleanup — empty deps ensures this never re-runs mid-session
  useEffect(() => {
    return () => {
      startedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    // Prevent double-invocation from React StrictMode mounting effects twice
    if (startedRef.current) return;
    startedRef.current = true;

    setError(null);
    setAudioBlob(null);
    setElapsedSeconds(0);
    chunksRef.current = [];

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream; // ref for cleanup
      setStream(mediaStream);          // state for waveform hook

      const detectedMime = getBestMimeType();
      setMimeType(detectedMime || 'audio/webm');
      const recorder = new MediaRecorder(mediaStream, detectedMime ? { mimeType: detectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: detectedMime || 'audio/webm',
        });
        setAudioBlob(blob);
        setRecordingState('stopped');
        mediaStream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setRecordingState('recording');

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);

      // Auto-stop after max duration
      if (maxSeconds > 0) {
        autoStopRef.current = setTimeout(() => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          recorder.stop();
        }, maxSeconds * 1000);
      }
    } catch (err) {
      startedRef.current = false; // allow retry on permission error
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow access in your browser settings.');
        } else {
          setError('Could not start recording. Please try again.');
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
    setAudioBlob(null);
    setStream(null);
    setError(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, []);

  return {
    recordingState,
    elapsedSeconds,
    maxSeconds,
    audioBlob,
    mimeType,
    stream,
    error,
    startRecording,
    stopRecording,
    reset,
  };
}
