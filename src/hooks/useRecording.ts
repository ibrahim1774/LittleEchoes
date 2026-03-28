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

/**
 * Convert any audio blob to WAV (PCM) format for universal playback.
 * Decodes using AudioContext, downsamples to 16kHz mono, encodes as WAV.
 */
async function convertToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  void audioCtx.close();

  // Downsample to 16kHz mono
  const TARGET_RATE = 16000;
  const srcData = decoded.getChannelData(0); // mono — take first channel
  const ratio = decoded.sampleRate / TARGET_RATE;
  const newLength = Math.floor(srcData.length / ratio);
  const samples = new Int16Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    // Clamp float [-1,1] to int16
    const s = Math.max(-1, Math.min(1, srcData[srcIndex]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Build WAV file
  const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wavBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // mono
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true);  // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset + i * 2, samples[i], true);
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
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
        const rawBlob = new Blob(chunksRef.current, {
          type: detectedMime || 'audio/webm',
        });
        mediaStream.getTracks().forEach((t) => t.stop());

        // Convert to WAV for universal playback across all iOS versions
        convertToWav(rawBlob)
          .then((wavBlob) => {
            setAudioBlob(wavBlob);
            setMimeType('audio/wav');
            setRecordingState('stopped');
          })
          .catch(() => {
            // Fallback: use original blob if conversion fails
            setAudioBlob(rawBlob);
            setRecordingState('stopped');
          });
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
