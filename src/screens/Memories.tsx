import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { getRecordingsByChild, getSessionsByChild } from '@/services/storage';
import { EmptyMemoriesIllustration } from '@/components/illustrations/EmptyMemoriesIllustration';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/questions';
import type { Recording, RecordingSession } from '@/types';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😄',
  silly: '🤪',
  thoughtful: '🤔',
  shy: '😊',
  excited: '🤩',
  sad: '😢',
};

function AudioPlayer({ blob }: { blob: Blob }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    audio.onended = () => { setIsPlaying(false); setProgress(0); };
    return () => { audio.pause(); URL.revokeObjectURL(url); };
  }, [blob]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setProgress(ratio);
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-echo-sky flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      {/* Progress bar */}
      <div
        className="flex-1 h-2 bg-echo-light-gray rounded-full cursor-pointer relative"
        onClick={handleProgressClick}
      >
        <div
          className="absolute top-0 left-0 h-full bg-echo-coral rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <span className="font-inter text-xs text-echo-gray w-8 text-right">
        {formatDuration(Math.round(duration))}
      </span>
    </div>
  );
}

interface GroupedSession {
  session: RecordingSession;
  recordings: Recording[];
}

export function Memories() {
  const { state } = useApp();
  const { activeChild } = state;
  const [groups, setGroups] = useState<GroupedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeChild) return;
    async function load() {
      if (!activeChild) return;
      setLoading(true);
      const [sessions, recordings] = await Promise.all([
        getSessionsByChild(activeChild.id),
        getRecordingsByChild(activeChild.id),
      ]);

      const recordingMap = new Map<string, Recording[]>();
      for (const rec of recordings) {
        const arr = recordingMap.get(rec.sessionId) ?? [];
        arr.push(rec);
        recordingMap.set(rec.sessionId, arr);
      }

      const grouped: GroupedSession[] = sessions
        .filter((s) => s.status === 'completed')
        .map((s) => ({ session: s, recordings: recordingMap.get(s.id) ?? [] }))
        .sort((a, b) => b.session.date.localeCompare(a.session.date));

      setGroups(grouped);
      setLoading(false);
    }
    void load();
  }, [activeChild]);

  function toggleExpanded(recId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId);
      else next.add(recId);
      return next;
    });
  }

  if (!activeChild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-echo-cream pb-24">
        <p className="text-echo-gray font-nunito">No child selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
          💫 Memories
        </h1>
        <p className="font-inter text-echo-gray text-sm mt-0.5">
          {activeChild.name}'s voice echoes
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-3xl animate-bounce">🎵</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 gap-6">
          <EmptyMemoriesIllustration />
          <div className="text-center">
            <h2 className="font-nunito font-bold text-lg text-echo-charcoal dark:text-white">
              No echoes yet
            </h2>
            <p className="font-nunito text-echo-gray text-sm mt-1">
              Record {activeChild.name}'s first session to start building memories!
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-6">
          {groups.map(({ session, recordings }) => (
            <div key={session.id}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{activeChild.avatarEmoji}</span>
                <h2 className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                  {formatDate(session.date)}
                </h2>
              </div>

              {/* Recording cards */}
              <div className="space-y-2">
                {recordings.map((rec) => {
                  const isOpen = expanded.has(rec.id);
                  const catColor = CATEGORY_COLORS[rec.questionId.split('-')[0]] ?? '#8E8E93';

                  return (
                    <div
                      key={rec.id}
                      className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpanded(rec.id)}
                        className="w-full flex items-start gap-3 p-4 text-left"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: catColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-nunito font-semibold text-sm text-echo-charcoal dark:text-white leading-snug ${isOpen ? '' : 'line-clamp-2'}`}>
                            {rec.questionText}
                          </p>
                          <p className="font-inter text-xs text-echo-gray mt-0.5">
                            {CATEGORY_LABELS[rec.questionId.split('-')[0]] ?? ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {rec.emotionTag && (
                            <span className="text-base">{EMOTION_EMOJIS[rec.emotionTag]}</span>
                          )}
                          <span className="font-inter text-xs bg-echo-sky/15 text-echo-sky px-2 py-0.5 rounded-full">
                            {formatDuration(rec.durationSeconds)}
                          </span>
                          <svg
                            width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2"
                            className={`text-echo-gray transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          >
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 border-t border-echo-light-gray dark:border-white/10">
                          <AudioPlayer blob={rec.audioBlob} />
                          {rec.transcription && (
                            <p className="font-nunito text-sm text-echo-gray mt-3 italic leading-relaxed">
                              "{rec.transcription}"
                            </p>
                          )}
                          {rec.parentNote && (
                            <p className="font-inter text-xs text-echo-gray mt-2 bg-echo-cream dark:bg-echo-dark-bg rounded-lg px-3 py-2">
                              📝 {rec.parentNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
