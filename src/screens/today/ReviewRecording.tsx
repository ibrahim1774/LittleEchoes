import { useState, useRef } from 'react';
import type { Question, Recording } from '@/types';
import { CATEGORY_COLORS } from '@/data/questions';

interface Props {
  question?: Question;
  questionIndex: number;
  totalQuestions: number;
  blob: Blob;
  duration: number;
  onReRecord: () => void;
  onNext: (
    blob: Blob,
    duration: number,
    emotionTag?: Recording['emotionTag'],
    parentNote?: string
  ) => void;
  isFreeRecording?: boolean;
}

const EMOTIONS: { tag: Recording['emotionTag']; emoji: string; label: string; color: string }[] = [
  { tag: 'happy', emoji: '😄', label: 'Happy', color: '#FFD93D' },
  { tag: 'silly', emoji: '🤪', label: 'Silly', color: '#FF8FAB' },
  { tag: 'thoughtful', emoji: '🤔', label: 'Thoughtful', color: '#6BC5F8' },
  { tag: 'shy', emoji: '😊', label: 'Shy', color: '#A8E06C' },
  { tag: 'excited', emoji: '🤩', label: 'Excited', color: '#FF6B6B' },
  { tag: 'sad', emoji: '😢', label: 'Sad', color: '#C4A1FF' },
];

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function ReviewRecording({
  question,
  questionIndex,
  totalQuestions,
  blob,
  duration,
  onReRecord,
  onNext,
  isFreeRecording,
}: Props) {
  const [selectedEmotion, setSelectedEmotion] = useState<Recording['emotionTag']>(undefined);
  const [parentNote, setParentNote] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const categoryColor = isFreeRecording ? '#8E8E93' : (question ? CATEGORY_COLORS[question.category] : '#FF6B6B');
  const isLast = isFreeRecording || questionIndex >= totalQuestions - 1;

  function togglePlayback() {
    if (!audioRef.current) {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }

  function handleNext() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onNext(blob, duration, selectedEmotion, parentNote.trim() || undefined);
  }

  // Frozen waveform — just decorative bars
  const frozenBars = Array.from({ length: 30 }, (_, i) => {
    const wave = Math.sin((i / 29) * Math.PI * 4) * 0.5 + 0.5;
    return Math.max(8, Math.round(wave * 70));
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-echo-cream to-white dark:from-echo-dark-bg dark:to-echo-dark-card flex flex-col px-6 pt-12 pb-10">
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

      {/* Question or free recording label */}
      <p className="font-nunito font-semibold text-sm text-echo-gray text-center mb-1">
        {isFreeRecording ? '🎙️ Free Recording' : question ? `"${question.text}"` : ''}
      </p>

      {/* Duration badge */}
      <div className="flex justify-center mb-6">
        <span className="font-inter text-xs bg-echo-sky/20 text-echo-sky px-3 py-1 rounded-full font-semibold">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Playback area */}
      <div className="flex flex-col items-center gap-4 mb-6">
        {/* Frozen waveform */}
        <div className="flex items-center gap-[2px] h-12">
          {frozenBars.map((height, i) => {
            const progress = i / (frozenBars.length - 1);
            const r = Math.round(255 * (1 - progress) + 196 * progress);
            const g = Math.round(107 * (1 - progress) + 161 * progress);
            const b = Math.round(107 * (1 - progress) + 255 * progress);
            return (
              <div
                key={i}
                className="w-[4px] rounded-full"
                style={{
                  height: `${height}%`,
                  backgroundColor: `rgb(${r},${g},${b})`,
                  opacity: isPlaying ? 1 : 0.6,
                }}
              />
            );
          })}
        </div>

        {/* Play/Pause button */}
        <button
          onClick={togglePlayback}
          className="w-14 h-14 rounded-full bg-echo-sky flex items-center justify-center shadow-soft active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      {/* Emotion tag picker */}
      <div className="mb-5">
        <p className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm mb-3 text-center">
          How was this answer? <span className="font-normal text-echo-gray">(optional)</span>
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {EMOTIONS.map(({ tag, emoji, label, color }) => (
            <button
              key={tag}
              onClick={() => setSelectedEmotion(selectedEmotion === tag ? undefined : tag)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-nunito font-semibold text-sm transition-all active:scale-95 ${
                selectedEmotion === tag
                  ? 'text-white scale-105'
                  : 'bg-white dark:bg-echo-dark-card text-echo-charcoal dark:text-white shadow-soft'
              }`}
              style={selectedEmotion === tag ? { backgroundColor: color } : {}}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Parent note */}
      <div className="mb-6">
        <textarea
          placeholder="Add a note (optional) — e.g. 'told the funniest story about his friend'"
          value={parentNote}
          onChange={(e) => setParentNote(e.target.value)}
          rows={2}
          className="w-full bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray dark:border-white/10 rounded-xl px-4 py-3 font-nunito text-sm text-echo-charcoal dark:text-white placeholder-echo-gray focus:outline-none focus:border-echo-coral transition-colors resize-none"
          maxLength={300}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleNext}
          className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform"
        >
          {isFreeRecording ? '✨ Save Recording' : isLast ? '✨ Finish Session' : 'Next Question →'}
        </button>

        <button
          onClick={onReRecord}
          className="text-echo-gray font-nunito text-sm text-center active:opacity-70"
        >
          🔄 Re-record
        </button>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
