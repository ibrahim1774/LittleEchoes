import { useEffect, useState, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getRecordingsByChild, getSessionsByChild, deleteRecording, getVideosByChild, deleteVideo } from '@/services/storage';
import { downloadAudioFromCloud, deleteRecordingFromCloud, downloadVideoFromCloud, deleteVideoFromCloud, syncToCloud } from '@/services/cloudSync';
import { EmptyMemoriesIllustration } from '@/components/illustrations/EmptyMemoriesIllustration';
import { CATEGORY_COLORS } from '@/data/questions';
import type { Recording, RecordingSession, VideoClip } from '@/types';

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

function AudioPlayer({ blob, audioUrl, fallbackDuration, userId, recordingId, mimeType }: { blob?: Blob; audioUrl?: string; fallbackDuration?: number; userId?: string; recordingId: string; mimeType?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration ?? 0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  // True when we have a cloud URL but haven't downloaded the blob yet
  const needsDownload = !blob && !!audioUrl;

  function setupAudio(audioBlob: Blob) {
    const url = URL.createObjectURL(audioBlob);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
      setCurrentTime(audio.currentTime);
    };
    audio.onended = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    return audio;
  }

  // Only init audio immediately if we have a local blob
  useEffect(() => {
    if (blob) {
      setupAudio(blob);
    }
    return () => {
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [blob]);

  // Handle play — downloads from cloud on first tap (keeps iOS user-gesture chain intact)
  async function handlePlay() {
    console.log('[AudioPlayer] handlePlay', { blob: !!blob, audioUrl, userId, recordingId, audioRefExists: !!audioRef.current });

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // Already have audio ready — just play
    if (audioRef.current) {
      void audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Need to download from cloud first — try audioUrl, then fallback paths with both extensions
    const pathsToTry = [
      audioUrl,
      userId ? `${userId}/${recordingId}.wav` : null,
      userId ? `${userId}/${recordingId}.webm` : null,
      userId ? `${userId}/${recordingId}.mp4` : null,
    ].filter((p): p is string => !!p);

    console.log('[AudioPlayer] pathsToTry', pathsToTry);

    if (pathsToTry.length === 0) { console.log('[AudioPlayer] No paths to try!'); setAudioError(true); return; }

    setLoadingAudio(true);
    let downloaded: Blob | null = null;
    for (const path of pathsToTry) {
      console.log('[AudioPlayer] Trying path:', path);
      downloaded = await downloadAudioFromCloud(path);
      console.log('[AudioPlayer] Result:', path, downloaded ? `${downloaded.size} bytes` : 'null');
      if (downloaded) break;
    }
    setLoadingAudio(false);

    if (!downloaded) { console.log('[AudioPlayer] All paths failed'); setAudioError(true); return; }

    // Re-wrap blob with correct MIME type to help the browser pick the right decoder
    const typedBlob = mimeType && downloaded.type !== mimeType
      ? new Blob([downloaded], { type: mimeType })
      : downloaded;

    const audio = setupAudio(typedBlob);
    // Play immediately — still within the user-gesture chain on most browsers
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // If autoplay still blocked, user can tap again
      setIsPlaying(false);
    }
  }

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setProgress(ratio);
  }

  if (audioError) {
    return (
      <p className="font-inter text-xs text-echo-gray mt-2">Audio not available on this device</p>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={() => void handlePlay()}
        className="w-9 h-9 rounded-full bg-echo-sky flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
        aria-label={isPlaying ? 'Pause' : loadingAudio ? 'Loading' : 'Play'}
      >
        {loadingAudio
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : isPlaying
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
        {needsDownload && !audioRef.current
          ? formatDuration(Math.round(duration))
          : `${formatDuration(Math.round(currentTime))} / ${formatDuration(Math.round(duration))}`
        }
      </span>
    </div>
  );
}

function VideoPlayer({ blob, videoUrl, userId, videoId }: { blob?: Blob; videoUrl?: string; userId?: string; videoId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (blob) {
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setObjectUrl(url);
      return () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      };
    }

    async function init() {
      const pathsToTry = [
        videoUrl,
        userId ? `${userId}/${videoId}.mp4` : null,
        userId ? `${userId}/${videoId}.webm` : null,
      ].filter((p): p is string => !!p);

      if (pathsToTry.length === 0) { setError(true); return; }

      setLoading(true);
      let videoBlob: Blob | null = null;
      for (const path of pathsToTry) {
        videoBlob = await downloadVideoFromCloud(path);
        if (videoBlob) break;
      }
      setLoading(false);

      if (cancelled) return;
      if (!videoBlob) { setError(true); return; }

      const url = URL.createObjectURL(videoBlob);
      urlRef.current = url;
      setObjectUrl(url);
    }

    void init();
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [blob, videoUrl]);

  if (loading) {
    return (
      <div className="aspect-video bg-echo-light-gray dark:bg-echo-dark-card rounded-2xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-echo-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-echo-light-gray dark:bg-echo-dark-card rounded-2xl flex items-center justify-center">
        <p className="font-inter text-xs text-echo-gray">Video not available</p>
      </div>
    );
  }

  if (!objectUrl) return null;

  return (
    <video
      ref={videoRef}
      src={objectUrl}
      controls
      playsInline
      className="w-full rounded-2xl bg-black"
      style={{ aspectRatio: '16/9' }}
    />
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
  const ext = rec.mimeType?.includes('wav') ? 'wav' : rec.mimeType?.includes('mp4') ? 'mp4' : 'webm';
  a.download = `${childName}_${rec.createdAt.slice(0, 10)}_echo.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadVideoClip(clip: VideoClip, childName: string) {
  let blob = clip.videoBlob;
  if (!blob && clip.videoUrl) {
    blob = await downloadVideoFromCloud(clip.videoUrl) ?? undefined;
  }
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = clip.mimeType?.includes('mp4') ? 'mp4' : 'webm';
  a.download = `${childName}_${clip.date}_video.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function VideoCard({
  clip,
  isOpen,
  onToggle,
  childName,
  onDelete,
  userId,
}: {
  clip: VideoClip;
  isOpen: boolean;
  onToggle: () => void;
  childName: string;
  onDelete: (id: string) => void;
  userId?: string;
}) {
  return (
    <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="w-6 h-6 flex-shrink-0 mt-0.5 flex items-center justify-center rounded-full bg-echo-sky/15">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-nunito font-semibold text-sm text-echo-charcoal dark:text-white leading-snug ${isOpen ? '' : 'line-clamp-2'}`}>
            {clip.caption || 'Video clip'}
          </p>
          <p className="font-inter text-xs text-echo-gray mt-0.5">Video</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-inter text-xs bg-echo-sky/15 text-echo-sky px-2 py-0.5 rounded-full">
            {clip.durationSeconds ? formatDuration(clip.durationSeconds) : '—'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-echo-gray transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t border-echo-light-gray dark:border-white/10">
          <div className="mt-3">
            <VideoPlayer blob={clip.videoBlob} videoUrl={clip.videoUrl} userId={userId} videoId={clip.id} />
          </div>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => void downloadVideoClip(clip, childName)}
              className="flex items-center gap-1.5 text-echo-gray hover:text-echo-coral transition-colors active:scale-95"
              aria-label="Download video"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span className="font-inter text-xs">Download</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this video? This cannot be undone.')) {
                  onDelete(clip.id);
                }
              }}
              className="flex items-center gap-1.5 text-echo-gray hover:text-red-500 transition-colors active:scale-95"
              aria-label="Delete video"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span className="font-inter text-xs">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordingCard({
  rec,
  isOpen,
  onToggle,
  childName,
  onDelete,
  userId,
}: {
  rec: Recording;
  isOpen: boolean;
  onToggle: () => void;
  childName: string;
  onDelete: (id: string) => void;
  userId?: string;
}) {
  const catKey = rec.questionId.split('-')[0];
  const catColor = CATEGORY_COLORS[catKey] ?? '#8E8E93';
  const isFree = rec.questionText === 'Free recording' || rec.questionText === 'Custom audio' || rec.questionId.startsWith('free-');
  const title = rec.parentNote || (isFree ? 'Custom audio' : rec.questionText);
  const subtitle = isFree ? 'Custom audio' : 'Question of the day';

  return (
    <div className="bg-white dark:bg-echo-dark-card rounded-2xl shadow-soft overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: catColor }} />
        <div className="flex-1 min-w-0">
          <p className={`font-nunito font-semibold text-sm text-echo-charcoal dark:text-white leading-snug ${isOpen ? '' : 'line-clamp-2'}`}>
            {title}
          </p>
          <p className="font-inter text-xs text-echo-gray mt-0.5">{subtitle}</p>
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
          <AudioPlayer blob={rec.audioBlob} audioUrl={rec.audioUrl} fallbackDuration={rec.durationSeconds} userId={userId} recordingId={rec.id} mimeType={rec.mimeType} />
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={() => void downloadRecording(rec, childName)}
              className="flex items-center gap-1.5 text-echo-gray hover:text-echo-coral transition-colors active:scale-95"
              aria-label="Download recording"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span className="font-inter text-xs">Download</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this recording? This cannot be undone.')) {
                  onDelete(rec.id);
                }
              }}
              className="flex items-center gap-1.5 text-echo-gray hover:text-red-500 transition-colors active:scale-95"
              aria-label="Delete recording"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span className="font-inter text-xs">Delete</span>
            </button>
          </div>
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

  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [mediaType, setMediaType] = useState<'all' | 'audio' | 'video'>('all');

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'growth'>('timeline');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const recordingsRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [calMonth, setCalMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  // Growth tab state
  const [growthRange, setGrowthRange] = useState<'3m' | '6m' | '1y' | 'all'>('all');
  const [growthInterval, setGrowthInterval] = useState<number>(7);
  const [playAllIndex, setPlayAllIndex] = useState<number | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const playAllAudioRef = useRef<HTMLAudioElement | null>(null);
  const growthCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!activeChild) return;

    function buildGroups(sessions: RecordingSession[], recordings: Recording[]): GroupedSession[] {
      const recordingMap = new Map<string, Recording[]>();
      for (const rec of recordings) {
        const arr = recordingMap.get(rec.sessionId) ?? [];
        arr.push(rec);
        recordingMap.set(rec.sessionId, arr);
      }
      return sessions
        .filter((s) => (recordingMap.get(s.id) ?? []).length > 0)
        .map((s) => ({ session: s, recordings: recordingMap.get(s.id) ?? [] }))
        .sort((a, b) => b.session.date.localeCompare(a.session.date));
    }

    async function load() {
      if (!activeChild) return;
      setLoading(true);
      const [sessions, recordings, childVideos] = await Promise.all([
        getSessionsByChild(activeChild.id),
        getRecordingsByChild(activeChild.id),
        getVideosByChild(activeChild.id),
      ]);
      setGroups(buildGroups(sessions, recordings));
      setVideos(childVideos);
      setLoading(false);

      // Sync any recordings with local blobs but no audioUrl to Supabase Storage
      if (state.user) {
        await syncToCloud(state.user);
        // Reload to pick up newly-set audioUrls/videoUrls
        const [freshSessions, freshRecordings, freshVideos] = await Promise.all([
          getSessionsByChild(activeChild.id),
          getRecordingsByChild(activeChild.id),
          getVideosByChild(activeChild.id),
        ]);
        setGroups(buildGroups(freshSessions, freshRecordings));
        setVideos(freshVideos);
      }
    }
    void load();
  }, [activeChild, state.user]);

  function toggleExpanded(recId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId); else next.add(recId);
      return next;
    });
  }

  function handleDeleteRecording(recId: string) {
    // Remove from local state immediately
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, recordings: g.recordings.filter((r) => r.id !== recId) }))
        .filter((g) => g.recordings.length > 0)
    );
    // Find the recording to get audioUrl before deleting
    const rec = groups.flatMap((g) => g.recordings).find((r) => r.id === recId);
    // Delete from IndexedDB
    void deleteRecording(recId);
    // Delete from cloud if signed in
    if (state.user) {
      void deleteRecordingFromCloud(state.user, recId, rec?.audioUrl);
    }
  }

  function handleDeleteVideo(videoId: string) {
    const clip = videos.find((v) => v.id === videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    void deleteVideo(videoId);
    if (state.user && clip) {
      void deleteVideoFromCloud(state.user, videoId, clip.videoUrl);
    }
  }

  // Unified timeline entries for interleaving audio sessions and video clips
  type TimelineEntry =
    | { type: 'session'; date: string; session: RecordingSession; recordings: Recording[] }
    | { type: 'video'; date: string; clips: VideoClip[] };

  const timelineEntries: TimelineEntry[] = useMemo(() => {
    const entries: TimelineEntry[] = [];
    if (mediaType !== 'video') {
      for (const g of applyFilter(groups, activeCategory)) {
        entries.push({ type: 'session', date: g.session.date, session: g.session, recordings: g.recordings });
      }
    }
    if (mediaType !== 'audio') {
      const videosByDateMap = new Map<string, VideoClip[]>();
      for (const v of videos) {
        const arr = videosByDateMap.get(v.date) ?? [];
        arr.push(v);
        videosByDateMap.set(v.date, arr);
      }
      for (const [date, clips] of videosByDateMap) {
        entries.push({ type: 'video', date, clips });
      }
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
  }, [groups, videos, mediaType, activeCategory]);

  const datesWithRecordings = new Set(groups.map((g) => g.session.date));
  const datesWithVideos = new Set(videos.map((v) => v.date));
  const datesWithContent = new Set([
    ...(mediaType !== 'video' ? datesWithRecordings : []),
    ...(mediaType !== 'audio' ? datesWithVideos : []),
  ]);

  const recordingsByDate = new Map<string, Recording[]>();
  for (const g of groups) {
    const existing = recordingsByDate.get(g.session.date) ?? [];
    recordingsByDate.set(g.session.date, [...existing, ...g.recordings]);
  }

  const calendarCells = buildCalendarGrid(calMonth.year, calMonth.month);
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  // Growth montage computation
  type MontageEntry = { rec: Recording; windowStart: Date; windowEnd: Date; windowRecCount: number };
  const growthMontage: MontageEntry[] = (() => {
    const allRecs = groups.flatMap((g) => g.recordings).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt)
    );
    if (allRecs.length === 0) return [];

    // Filter by time range
    const cutoff = new Date();
    if (growthRange === '3m') cutoff.setMonth(cutoff.getMonth() - 3);
    else if (growthRange === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
    else if (growthRange === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);
    else cutoff.setFullYear(2000); // 'all'

    const filtered = allRecs.filter((r) => new Date(r.createdAt) >= cutoff);
    if (filtered.length === 0) return [];

    // Divide into interval windows and pick one per window
    const startDate = new Date(filtered[0].createdAt);
    const endDate = new Date(filtered[filtered.length - 1].createdAt);
    const msPerDay = 86400000;
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
    const windowCount = Math.max(1, Math.ceil(totalDays / growthInterval));

    const montage: MontageEntry[] = [];
    for (let w = 0; w < windowCount; w++) {
      const windowStart = new Date(startDate.getTime() + w * growthInterval * msPerDay);
      const windowEnd = new Date(windowStart.getTime() + growthInterval * msPerDay);
      const windowRecs = filtered.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= windowStart && d < windowEnd;
      });
      if (windowRecs.length > 0) {
        // Pick using child ID + window index + shuffle seed
        const seed = (activeChild?.id ?? '').length + w + shuffleSeed * 7;
        montage.push({
          rec: windowRecs[seed % windowRecs.length],
          windowStart,
          windowEnd,
          windowRecCount: windowRecs.length,
        });
      }
    }
    return montage;
  })();

  function prevMonth() {
    setCalMonth((m) => m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCalMonth((m) => m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 });
    setSelectedDate(null);
  }

  const selectedDayRecs: Recording[] = selectedDate && mediaType !== 'video'
    ? (() => {
        const recs = recordingsByDate.get(selectedDate) ?? [];
        if (!activeCategory) return recs;
        return recs.filter((r) => r.questionId.split('-')[0] === activeCategory);
      })()
    : [];

  const selectedDayVideos: VideoClip[] = selectedDate && mediaType !== 'audio'
    ? videos.filter((v) => v.date === selectedDate)
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
          {(['timeline', 'calendar', 'growth'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setSelectedDate(null); setPlayAllIndex(null); }}
              className={`px-4 py-1.5 rounded-full font-nunito font-bold text-sm transition-all ${
                viewMode === mode ? 'bg-echo-coral text-white shadow-sm' : 'text-echo-gray'
              }`}
            >
              {mode === 'timeline' ? '📋 Timeline' : mode === 'calendar' ? '📅 Calendar' : '🌱 Growth'}
            </button>
          ))}
        </div>
      </div>

      {/* Media type toggle */}
      <div className="px-4 mb-3">
        <div className="flex bg-white dark:bg-echo-dark-card rounded-full p-1 shadow-soft w-fit">
          {(['all', 'audio', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setMediaType(type); if (type === 'video') setActiveCategory(null); }}
              className={`px-4 py-1.5 rounded-full font-nunito font-bold text-sm transition-all ${
                mediaType === type ? 'bg-echo-sky text-white shadow-sm' : 'text-echo-gray'
              }`}
            >
              {type === 'all' ? '✨ All' : type === 'audio' ? '🎙️ Audio' : '🎬 Video'}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter chips (hidden in growth view and video-only mode) */}
      {viewMode !== 'growth' && mediaType !== 'video' && <div className="px-4 mb-4">
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
      </div>}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-3xl animate-bounce">🎵</div>
        </div>
      ) : groups.length === 0 && videos.length === 0 ? (
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
          {timelineEntries.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-4xl">🔍</span>
              <p className="font-nunito text-echo-gray text-sm text-center">
                {mediaType === 'video' ? 'No video clips yet.' : mediaType === 'audio' ? 'No audio echoes in this category yet.' : 'No echoes in this category yet.'}
              </p>
            </div>
          ) : (
            timelineEntries.map((entry) =>
              entry.type === 'session' ? (
                <div key={entry.session.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{activeChild.avatarEmoji}</span>
                    <h2 className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                      {formatDate(entry.date)}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {entry.recordings.map((rec) => (
                      <RecordingCard
                        key={rec.id}
                        rec={rec}
                        isOpen={expanded.has(rec.id)}
                        onToggle={() => toggleExpanded(rec.id)}
                        childName={activeChild.name}
                        onDelete={handleDeleteRecording}
                      userId={state.user?.id}
                    />
                  ))}
                  </div>
                </div>
              ) : (
                <div key={`video-${entry.date}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{activeChild.avatarEmoji}</span>
                    <h2 className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                      {formatDate(entry.date)}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {entry.clips.map((clip) => (
                      <VideoCard
                        key={clip.id}
                        clip={clip}
                        isOpen={expanded.has(clip.id)}
                        onToggle={() => toggleExpanded(clip.id)}
                        childName={activeChild.name}
                        onDelete={handleDeleteVideo}
                        userId={state.user?.id}
                      />
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>

      ) : viewMode === 'calendar' ? (

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
                const hasRec = datesWithContent.has(dateStr);
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

          {/* Selected day recordings & videos */}
          {selectedDate ? (
            <div ref={recordingsRef}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{activeChild.avatarEmoji}</span>
                <h3 className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              {selectedDayRecs.length === 0 && selectedDayVideos.length === 0 ? (
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
                      onDelete={handleDeleteRecording}
                      userId={state.user?.id}
                    />
                  ))}
                  {selectedDayVideos.map((clip) => (
                    <VideoCard
                      key={clip.id}
                      clip={clip}
                      isOpen={expanded.has(clip.id)}
                      onToggle={() => toggleExpanded(clip.id)}
                      childName={activeChild.name}
                      onDelete={handleDeleteVideo}
                      userId={state.user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="text-4xl">👆</span>
              <p className="font-nunito text-echo-gray text-sm text-center px-8">
                Tap a highlighted day to see that day's echoes
              </p>
            </div>
          )}
        </div>
      ) : viewMode === 'growth' ? (

        /* ── GROWTH VIEW ── */
        <div className="px-4">
          {mediaType === 'video' ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-4xl">🎬</span>
              <p className="font-nunito text-echo-gray text-sm text-center px-4">
                Growth view shows audio recordings over time. Switch to Timeline or Calendar to view videos.
              </p>
            </div>
          ) : (<>
          {/* Time range chips */}
          <div className="mb-3">
            <p className="font-nunito font-bold text-xs text-echo-gray uppercase tracking-wider mb-2">Time Range</p>
            <div className="flex gap-2">
              {([
                { key: '3m' as const, label: '3 months' },
                { key: '6m' as const, label: '6 months' },
                { key: '1y' as const, label: '1 year' },
                { key: 'all' as const, label: 'All time' },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setGrowthRange(opt.key); setPlayAllIndex(null); }}
                  className={`px-3 py-1.5 rounded-full font-nunito font-semibold text-xs transition-all active:scale-95 ${
                    growthRange === opt.key
                      ? 'bg-echo-coral text-white shadow-sm'
                      : 'bg-white dark:bg-echo-dark-card text-echo-gray shadow-soft'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval chips */}
          <div className="mb-4">
            <p className="font-nunito font-bold text-xs text-echo-gray uppercase tracking-wider mb-2">Interval</p>
            <div className="flex gap-2">
              {([
                { days: 7, label: 'Weekly' },
                { days: 30, label: 'Monthly' },
                { days: 182, label: '6 Months' },
                { days: 365, label: 'Yearly' },
              ]).map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => { setGrowthInterval(opt.days); setPlayAllIndex(null); }}
                  className={`px-3 py-1.5 rounded-full font-nunito font-semibold text-xs transition-all active:scale-95 ${
                    growthInterval === opt.days
                      ? 'bg-echo-sky text-white shadow-sm'
                      : 'bg-white dark:bg-echo-dark-card text-echo-gray shadow-soft'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {growthMontage.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="text-4xl">🌱</span>
              <p className="font-nunito text-echo-gray text-sm text-center px-4">
                No echoes in this time range yet. Keep recording!
              </p>
            </div>
          ) : (
            <>
              {/* Header + Shuffle + Play All */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                    {growthMontage.length} echo{growthMontage.length !== 1 ? 'es' : ''}
                  </p>
                  <button
                    onClick={() => { setShuffleSeed((s) => s + 1); setPlayAllIndex(null); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-echo-dark-card text-echo-gray shadow-soft font-nunito font-semibold text-xs transition-all active:scale-95"
                    aria-label="Shuffle recordings"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8"/>
                      <line x1="4" y1="20" x2="21" y2="3"/>
                      <polyline points="21 16 21 21 16 21"/>
                      <line x1="15" y1="15" x2="21" y2="21"/>
                      <line x1="4" y1="4" x2="9" y2="9"/>
                    </svg>
                    Shuffle
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (playAllIndex !== null) {
                      playAllAudioRef.current?.pause();
                      setPlayAllIndex(null);
                    } else {
                      setPlayAllIndex(0);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-nunito font-bold text-xs transition-all active:scale-95 ${
                    playAllIndex !== null
                      ? 'bg-echo-charcoal text-white'
                      : 'bg-echo-coral text-white shadow-coral'
                  }`}
                >
                  {playAllIndex !== null ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      Stop ({playAllIndex + 1}/{growthMontage.length})
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      Play All
                    </>
                  )}
                </button>
              </div>

              {/* Timeline cards */}
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-echo-light-gray dark:bg-white/10" />

                <div className="space-y-3">
                  {growthMontage.map((entry, i) => {
                    const { rec, windowStart, windowEnd, windowRecCount } = entry;
                    const isActive = playAllIndex === i;
                    const recDate = new Date(rec.createdAt);
                    const dateLabel = recDate.toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    });
                    const windowLabel = `${windowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${windowEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                    return (
                      <div
                        key={rec.id}
                        ref={(el) => { if (el) growthCardRefs.current.set(i, el); }}
                        className="relative pl-10 animate-fade-in"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 transition-all ${
                            isActive
                              ? 'bg-echo-coral border-echo-coral scale-125'
                              : 'bg-white dark:bg-echo-dark-card border-echo-light-gray dark:border-white/20'
                          }`}
                        />

                        <div
                          className={`bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft transition-all ${
                            isActive ? 'ring-2 ring-echo-coral' : ''
                          }`}
                        >
                          {/* Window range label */}
                          <p className="font-inter text-[10px] text-echo-coral font-semibold uppercase tracking-wider mb-1">
                            {windowLabel} · {windowRecCount} recording{windowRecCount !== 1 ? 's' : ''} in window
                          </p>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-inter text-xs text-echo-gray">{dateLabel}</p>
                            <span className="font-inter text-xs bg-echo-sky/15 text-echo-sky px-2 py-0.5 rounded-full">
                              {rec.durationSeconds ? formatDuration(rec.durationSeconds) : '—'}
                            </span>
                          </div>
                          <p className="font-nunito font-semibold text-sm text-echo-charcoal dark:text-white leading-snug">
                            {rec.parentNote || (rec.questionId.startsWith('free-') || rec.questionText === 'Custom audio' || rec.questionText === 'Free recording' ? 'Custom audio' : rec.questionText)}
                          </p>
                          <p className="font-inter text-xs text-echo-gray mb-2">
                            {rec.questionId.startsWith('free-') || rec.questionText === 'Custom audio' || rec.questionText === 'Free recording' ? 'Custom audio' : 'Question of the day'}
                          </p>
                          <AudioPlayer
                            blob={rec.audioBlob}
                            audioUrl={rec.audioUrl}
                            fallbackDuration={rec.durationSeconds}
                            userId={state.user?.id}
                            recordingId={rec.id}
                            mimeType={rec.mimeType}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          </>)}
        </div>

      ) : null}
    </div>
  );
}
