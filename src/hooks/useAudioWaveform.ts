import { useState, useEffect, useRef } from 'react';

const BAR_COUNT = 30;

export function useAudioWaveform(stream: MediaStream | null, active: boolean) {
  const [barHeights, setBarHeights] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !active) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 64;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      analyser.getByteFrequencyData(dataArray);

      // Map frequency bins → BAR_COUNT bars
      const bars: number[] = [];
      const binPerBar = Math.floor(dataArray.length / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const start = i * binPerBar;
        let sum = 0;
        for (let j = start; j < start + binPerBar; j++) {
          sum += dataArray[j] ?? 0;
        }
        const avg = sum / binPerBar;
        // Normalize to 0–100 with a minimum floor of 4 so bars are always visible
        bars.push(Math.max(4, Math.round((avg / 255) * 100)));
      }

      setBarHeights(bars);
      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      void audioCtx.close();
    };
  }, [stream, active]);

  // When inactive, return last frozen state (don't reset to zero)
  return barHeights;
}
