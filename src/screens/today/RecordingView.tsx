import { useEffect } from 'react';
import type { Question } from '@/types';
import { useRecording } from '@/hooks/useRecording';
import { useAudioWaveform } from '@/hooks/useAudioWaveform';
import { CATEGORY_COLORS } from '@/data/questions';

interface Props {
  question?: Question;
  questionIndex: number;
  totalQuestions: number;
  childName: string;
  onDone: (blob: Blob, duration: number) => void;
  isFreeRecording?: boolean;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Floating background bubbles
const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 8 + Math.random() * 16,
  left: Math.random() * 100,
  delay: Math.random() * 4,
  duration: 5 + Math.random() * 5,
  color: ['#FF6B6B', '#FFD93D', '#6BC5F8', '#C4A1FF', '#A8E06C'][i % 5],
}));

const MAX_SECONDS = 60;

export function RecordingView({
  question,
  questionIndex,
  totalQuestions,
  childName,
  onDone,
  isFreeRecording,
}: Props) {
  const { recordingState, elapsedSeconds, audioBlob, stream, error, startRecording, stopRecording } =
    useRecording(MAX_SECONDS);

  const barHeights = useAudioWaveform(stream, recordingState === 'recording');

  const categoryColor = isFreeRecording ? '#8E8E93' : (question ? CATEGORY_COLORS[question.category] : '#FF6B6B');
  const remaining = Math.max(0, MAX_SECONDS - elapsedSeconds);

  // Start recording immediately on mount
  useEffect(() => {
    void startRecording();
  }, [startRecording]);

  // When recording stops, send blob back
  useEffect(() => {
    if (recordingState === 'stopped' && audioBlob) {
      onDone(audioBlob, elapsedSeconds);
    }
  }, [recordingState, audioBlob, elapsedSeconds, onDone]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-echo-cream to-white dark:from-echo-dark-bg dark:to-echo-dark-card flex flex-col items-center px-6 pt-8 pb-28 relative overflow-hidden">
      {/* Floating background bubbles */}
      {BUBBLES.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: '-20px',
            backgroundColor: b.color,
            opacity: 0.15,
            animationName: 'float-up',
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            '--sway': `${(Math.random() - 0.5) * 40}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Progress */}
      {!isFreeRecording && (
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full ${i === questionIndex ? 'w-10' : 'w-6 opacity-30'}`}
              style={{ backgroundColor: i <= questionIndex ? categoryColor : '#F0F0F0' }}
            />
          ))}
        </div>
      )}

      {/* Question text or free recording label */}
      {isFreeRecording ? (
        <p className="font-nunito font-semibold text-base text-echo-charcoal dark:text-white text-center mb-2 px-2">
          🎤 Custom Audio
        </p>
      ) : question ? (
        <p className="font-nunito font-semibold text-sm text-echo-gray dark:text-echo-gray text-center mb-2 px-2">
          "{question.text}"
        </p>
      ) : null}

      {!isFreeRecording && question && (
        <p className="font-inter text-echo-gray text-xs mb-8">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
      )}

      {isFreeRecording && (
        <p className="font-inter text-echo-gray text-xs mb-8">
          Record anything — up to 1 minute
        </p>
      )}

      {/* Timer with countdown */}
      <div className="flex flex-col items-center mb-4">
        <p className="font-nunito font-bold text-xl text-echo-charcoal dark:text-white tabular-nums">
          {formatTime(elapsedSeconds)}
        </p>
        <p className={`font-inter text-xs mt-1 tabular-nums ${remaining <= 10 ? 'text-echo-coral font-semibold' : 'text-echo-gray'}`}>
          {remaining}s remaining
        </p>
      </div>

      {/* Stop button (pulsing) */}
      <button
        onClick={stopRecording}
        className="w-[120px] h-[120px] rounded-full bg-echo-coral flex items-center justify-center animate-recording active:scale-95 relative z-10"
        aria-label="Stop recording"
      >
        <StopIcon />
      </button>

      {/* Ring expansion effect */}
      <div
        className="absolute w-[120px] h-[120px] rounded-full border-4 border-echo-coral"
        style={{
          animationName: 'ring-expand',
          animationDuration: '1.5s',
          animationTimingFunction: 'ease-out',
          animationIterationCount: 'infinite',
        }}
      />

      <p className="font-nunito text-echo-gray text-sm mt-6 mb-6 z-10">
        {isFreeRecording
          ? `Recording ${childName}'s voice... tap to stop`
          : `Recording ${childName}'s answer... tap to stop`}
      </p>

      {/* Waveform visualizer */}
      <div className="flex items-center gap-[2px] h-16 z-10">
        {barHeights.map((height, i) => {
          const progress = i / (barHeights.length - 1);
          const r = Math.round(255 * (1 - progress) + 196 * progress);
          const g = Math.round(107 * (1 - progress) + 161 * progress);
          const b = Math.round(107 * (1 - progress) + 255 * progress);
          return (
            <div
              key={i}
              className="w-[4px] rounded-full transition-all duration-75"
              style={{
                height: `${height}%`,
                backgroundColor: `rgb(${r},${g},${b})`,
                minHeight: '4px',
              }}
            />
          );
        })}
      </div>

      {error && (
        <p className="text-echo-coral text-sm font-nunito mt-4 text-center">{error}</p>
      )}
    </div>
  );
}

function StopIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
