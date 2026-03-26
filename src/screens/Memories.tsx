import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { getRecordingsByChild, getSessionsByChild } from '@/services/storage';
import { downloadAudioFromCloud } from '@/services/cloudSync';
import { EmptyMemoriesIllustration } from '@/components/illustrations/EmptyMemoriesIllustration';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/questions';
import type { Recording, RecordingSession } from '@/types';

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😄', silly: '🤪', thoughtful: '🤔', shy: '😊', excited: '🤩', sad: '😢',
};

const CATEGORY_CHIPS = [
  { key: null,          label: 'All',        icon: '✨' },
  { key: 'favorites',   label: 'Favorites',  icon: '🎯' },
  { key: 'challenges',  label: 'Challenges', icon: '💪' },
  { key: 'emotions',    label: 'Emotions',   icon: '💜' },
  { key: 'learning',    label: 'Learning',   icon: '🌱' },
  { key: 'gratitude',   label: 'Gratitude',  icon: '💛' },
  { key: 'free',        label: 'Free',       icon: '🎙️' },
];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function AudioPlayer({ blob, audioUrl, fallbackDuration }: { blob?: Blob; audioUrl?: string; fallbackDuration?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration ?? 0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initAudio() {
      let audioBlob = blob;

      // If no local blob, download from Supabase Storage
      if (!audioBlob && audioUrl) {
        setLoadingAudio(true);
        audioBlob = await downloadAudioFromCloud(audioUrl) ?? undefined;
        setLoadingAudio(false);
        if (cancelled) return;
        if (!audioBlob) { setAudioError(true); return; }
      }

      if (!audioBlob) { setAudioError(true); return; }

      const url = URL.createObjectURL(audioBlob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      };
      audio.onended = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    }

    void initAudio();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [blob, audioUrl]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { void audioRef.current.play(); setIsPlaying(true); }
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setProgress(ratio);
  }

  if (loadingAudio) {
    return (
      <div className="flex items-center gap-2 mt-2 py-2">
        <div className="w-4 h-4 border-2 border-echo-sky border-t-transparent rounded-full animate-spin" />
        <span className="font-inter text-xs text-echo-gray">Loading audio...</span>
      </div>
    );
  }

  if (audioError) {
    return (
      <p className="font-inter text-xs text-echo-gray mt-2">Audio not available on this device</p>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-echo-sky flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        }
      </button>
      <div
        className="flex-1 h-2 bg-echo-light-gray rounded-full cursor-pointer relative"
        onClick={handleProgressClick}
      >
        <div
          className="absolute top-0 left-0 h-full bg-echo-coral rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="font-inter text-xs text-echo-gray text-right whitespace-nowrap">
        {isPlaying || currentTime > 0
          ? `${formatDuration(Math.round(currentTime))} / ${formatDuration(Math.round(duration))}`
          : formatDuration(Math.round(duration))
        }
      </span>
    </div>
  );
}

interface GroupedSession {
  session: RecordingSession;
  recordings: Recording[];
}

function applyFilter(groups: GroupedSession[], cat: string | null): GroupedSession[] {
  if (!cat) return groups;
  return groups
    .map((g) => ({
      ...g,
      recordings: g.recordings.filter((r) => r.questionId.split('-')[0] === cat),
    }))
    .filter((g) => g.recordings.length > 0);
}

async function downloadRecording(rec: Recording, childName: string) {
  let blob = rec.audioBlob;
  if (!blob && rec.audioUrl) {
    blob = await downloadAudioFromCloud(rec.audioUrl) ?? undefined;
  }
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${childName}_${rec.createdAt.slice(0, 10)}_echo.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function RecordingCard({
  rec,
  isOpen,
  onToggle,
  childName,
}: {
  rec: Recording;
  isOpen: boolean;
  onToggle: () => void;
  childName: string;
}) {
  const catKey = rec.questionId.split('-')[0];
  const catColor = CATEGORY_COLORS[catKey] ?? '#8E8E93';
  const catLabel = CATEGORY_LABELS[catKey] ?? '';

  return (
    <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: catColor }} />
        <div className="flex-1 min-w-0">
          <p className={`font-nunito font-semibold text-sm text-echo-charcoal dark:text-white leading-snug ${isOpen ? '' : 'line-clamp-2'}`}>
            {rec.questionText}
          </p>
          <p className="font-inter text-xs text-echo-gray mt-0.5">{catLabel}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {rec.emotionTag && <span className="text-base">{EMOTION_EMOJIS[rec.emotionTag]}</span>}
          <span className="font-inter text-xs bg-echo-sky/15 text-echo-sky px-2 py-0.5 rounded-full">
            {rec.durationSeconds ? formatDuration(rec.durationSeconds) : '—'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-echo-gray transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-echo-light-gray dark:border-white/10">
          <AudioPlayer blob={rec.audioBlob} audioUrl={rec.audioUrl} fallbackDuration={rec.durationSeconds} />
          <button
            onClick={() => void downloadRecording(rec, childName)}
            className="mt-2 flex items-center gap-1.5 text-echo-gray hover:text-echo-coral transition-colors active:scale-95"
            aria-label="Download recording"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="font-inter text-xs">Download</span>
          </button>
          {rec.transcription && (
            <p className="font-nunito text-sm text-echo-gray mt-3 italic leading-relaxed">"{rec.transcription}"</p>
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
}

export function Memories() {
  const { state } = useApp();
  const { activeChild } = state;
  const [groups, setGroups] = useState<GroupedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const recordingsRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [calMonth, setCalMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

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
        .filter((s) => (recordingMap.get(s.id) ?? []).length > 0)
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
      if (next.has(recId)) next.delete(recId); else next.add(recId);
      return next;
    });
  }

  const datesWithRecordings = new Set(groups.map((g) => g.session.date));

  const recordingsByDate = new Map<string, Recording[]>();
  for (const g of groups) {
    const existing = recordingsByDate.get(g.session.date) ?? [];
    recordingsByDate.set(g.session.date, [...existing, ...g.recordings]);
  }

  const filteredGroups = applyFilter(groups, activeCategory);
  const calendarCells = buildCalendarGrid(calMonth.year, calMonth.month);
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  function prevMonth() {
    setCalMonth((m) => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCalMonth((m) => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 });
    setSelectedDate(null);
  }

  const selectedDayRecs: Recording[] = selectedDate
    ? (() => {
        const recs = recordingsByDate.get(selectedDate) ?? [];
        if (!activeCategory) return recs;
        return recs.filter((r) => r.questionId.split('-')[0] === activeCategory);
      })()
    : [];

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

      {/* View toggle */}
      <div className="px-4 mb-3">
        <div className="flex bg-white dark:bg-echo-dark-card rounded-full p-1 shadow-soft w-fit">
          {(['timeline', 'calendar'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setSelectedDate(null); }}
              className={`px-5 py-1.5 rounded-full font-nunito font-bold text-sm transition-all ${
                viewMode === mode ? 'bg-echo-coral text-white shadow-sm' : 'text-echo-gray'
              }`}
            >
              {mode === 'timeline' ? '📋 Timeline' : '📅 Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = activeCategory === chip.key;
            const color = chip.key ? (CATEGORY_COLORS[chip.key] ?? '#8E8E93') : '#8E8E93';
            return (
              <button
                key={chip.key ?? 'all'}
                onClick={() => setActiveCategory(chip.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-nunito font-semibold text-xs flex-shrink-0 transition-all active:scale-95"
                style={
                  isActive
                    ? { backgroundColor: color, color: 'white' }
                    : { backgroundColor: '#F0F0F0', color: '#8E8E93' }
                }
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-3xl animate-bounce">🎵</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 gap-6">
          <EmptyMemoriesIllustration />
          <div className="text-center">
            <h2 className="font-nunito font-bold text-lg text-echo-charcoal dark:text-white">No echoes yet</h2>
            <p className="font-nunito text-echo-gray text-sm mt-1">
              Record {activeChild.name}'s first session to start building memories!
            </p>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (

        /* ── TIMELINE VIEW ── */
        <div className="px-4 space-y-6">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="font-nunito text-echo-gray text-sm text-center">No echoes in this category yet.</p>
            </div>
          ) : (
            filteredGroups.map(({ session, recordings }) => (
              <div key={session.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{activeChild.avatarEmoji}</span>
                  <h2 className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                    {formatDate(session.date)}
                  </h2>
                </div>
                <div className="space-y-2">
                  {recordings.map((rec) => (
                    <RecordingCard
                      key={rec.id}
                      rec={rec}
                      isOpen={expanded.has(rec.id)}
                      onToggle={() => toggleExpanded(rec.id)}
                      childName={activeChild.name}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      ) : (

        /* ── CALENDAR VIEW ── */
        <div className="px-4">
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft p-4 mb-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-full bg-echo-light-gray dark:bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Previous month"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="text-echo-charcoal dark:text-white">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <h3 className="font-nunito font-extrabold text-base text-echo-charcoal dark:text-white">
                {MONTH_NAMES[calMonth.month]} {calMonth.year}
              </h3>

              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-full bg-echo-light-gray dark:bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Next month"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="text-echo-charcoal dark:text-white">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center font-inter text-xs text-echo-gray font-semibold py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={`blank-${i}`} />;
                const dateStr = toDateStr(calMonth.year, calMonth.month, day);
                const hasRec = datesWithRecordings.has(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (!hasRec) return;
                      const next = isSelected ? null : dateStr;
                      setSelectedDate(next);
                      if (next) setTimeout(() => recordingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }}
                    disabled={!hasRec}
                    className="flex flex-col items-center justify-center py-1.5 rounded-xl transition-all"
                    style={
                      isSelected
                        ? { backgroundColor: '#FF6B6B' }
                        : isToday
                        ? { backgroundColor: '#F0F0F0' }
                        : {}
                    }
                  >
                    <span
                      className="font-nunito font-bold text-sm leading-none"
                      style={
                        isSelected ? { color: 'white' }
                        : hasRec ? { color: '#2D2D2D' }
                        : { color: '#C7C7CC' }
                      }
                    >
                      {day}
                    </span>
                    {hasRec && (
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-0.5"
                        style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.75)' : '#FF6B6B' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day recordings */}
          {selectedDate ? (
            <div ref={recordingsRef}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{activeChild.avatarEmoji}</span>
                <h3 className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              {selectedDayRecs.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <span className="text-3xl">🔍</span>
                  <p className="font-nunito text-echo-gray text-sm text-center">
                    {activeCategory ? 'No echoes in this category on this day.' : 'No echoes on this day.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayRecs.map((rec) => (
                    <RecordingCard
                      key={rec.id}
                      rec={rec}
                      isOpen={expanded.has(rec.id)}
                      onToggle={() => toggleExpanded(rec.id)}
                      childName={activeChild.name}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="text-4xl">👆</span>
              <p className="font-nunito text-echo-gray text-sm text-center px-8">
                Tap a highlighted day to hear that day's echoes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
