import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { saveVideo, getTodayVideo, getVideosByChild, deleteVideo } from '@/services/storage';
import { syncToCloud, downloadVideoFromCloud, deleteVideoFromCloud } from '@/services/cloudSync';
import { supabase } from '@/services/supabase';
import { useVideoRecording } from '@/hooks/useVideoRecording';
import type { VideoClip } from '@/types';

function generateId() {
  return crypto.randomUUID();
}

function formatDuration(s: number): string {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function VideoPlayer({ blob, videoUrl, userId, videoId }: { blob?: Blob; videoUrl?: string; userId?: string; videoId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // If we have a local blob, create URL immediately (no async needed)
    if (blob) {
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setObjectUrl(url);
      return () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      };
    }

    // Otherwise try downloading from cloud
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
        console.log('[VideoPlayer] Trying:', path);
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

export function VideoScreen() {
  const { state, dispatch } = useApp();
  const { activeChild } = state;
  const [phase, setPhase] = useState<'idle' | 'recording' | 'preview' | 'saved'>('idle');
  const [todayClip, setTodayClip] = useState<VideoClip | null>(null);
  const [pastClips, setPastClips] = useState<VideoClip[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const viewfinderRef = useRef<HTMLVideoElement>(null);

  const {
    recordingState, elapsedSeconds, maxSeconds, videoBlob, mimeType,
    stream, error: recError, startRecording, stopRecording, reset,
  } = useVideoRecording();

  // Load today's clip and past clips
  useEffect(() => {
    if (!activeChild) return;
    async function load() {
      if (!activeChild) return;
      const today = await getTodayVideo(activeChild.id);
      setTodayClip(today ?? null);
      dispatch({ type: 'SET_TODAY_VIDEO_RECORDED', payload: !!today });
      const all = await getVideosByChild(activeChild.id);
      setPastClips(all.filter((v) => v.id !== today?.id));
    }
    void load();
  }, [activeChild, phase]);

  // Wire stream to viewfinder
  useEffect(() => {
    if (viewfinderRef.current && stream) {
      viewfinderRef.current.srcObject = stream;
    }
  }, [stream]);

  // When recording stops, go to preview
  useEffect(() => {
    if (recordingState === 'stopped' && videoBlob) {
      setPhase('preview');
    }
  }, [recordingState, videoBlob]);

  async function handleSave() {
    if (!videoBlob || !activeChild) return;
    setSaving(true);

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const contentType = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';

    const clip: VideoClip = {
      id: generateId(),
      childId: activeChild.id,
      date: new Date().toISOString().split('T')[0],
      videoBlob,
      mimeType,
      durationSeconds: elapsedSeconds,
      caption: caption.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Upload to Supabase Storage immediately
    let videoUrl: string | undefined;
    if (state.user) {
      const path = `${state.user.id}/${clip.id}.${ext}`;
      const { error } = await supabase.storage
        .from('videos')
        .upload(path, videoBlob, { contentType, upsert: true });
      if (!error) {
        videoUrl = path;
        clip.videoUrl = path;
      } else {
        console.error('[VideoSave] Storage upload failed:', error.message);
      }
    }

    try {
      await saveVideo(clip);
    } catch {
      await saveVideo({ ...clip, videoBlob: undefined, videoUrl });
    }

    if (state.user) void syncToCloud(state.user);

    dispatch({ type: 'SET_TODAY_VIDEO_RECORDED', payload: true });
    setCaption('');
    reset();
    setSaving(false);
    setPhase('saved');
  }

  function handleDeleteClip(clipId: string, clipVideoUrl?: string) {
    if (!window.confirm('Delete this video? This cannot be undone.')) return;
    setPastClips((prev) => prev.filter((v) => v.id !== clipId));
    if (todayClip?.id === clipId) {
      setTodayClip(null);
      dispatch({ type: 'SET_TODAY_VIDEO_RECORDED', payload: false });
    }
    void deleteVideo(clipId);
    if (state.user) void deleteVideoFromCloud(state.user, clipId, clipVideoUrl);
  }

  if (!activeChild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-echo-cream dark:bg-echo-dark-bg pb-24">
        <p className="text-echo-gray font-nunito">No child selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
          📹 Video
        </h1>
        <p className="font-inter text-echo-gray text-sm mt-0.5">
          {activeChild.name}'s daily clip
        </p>
      </div>

      {/* ── RECORDING PHASE ── */}
      {phase === 'recording' && (
        <div className="px-4">
          <div className="relative rounded-2xl overflow-hidden bg-black mb-4" style={{ aspectRatio: '16/9' }}>
            <video
              ref={viewfinderRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Countdown overlay */}
            <div className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded-full">
              <span className={`font-nunito font-bold text-sm tabular-nums ${maxSeconds - elapsedSeconds <= 5 ? 'text-echo-coral' : 'text-white'}`}>
                {maxSeconds - elapsedSeconds}s
              </span>
            </div>
          </div>

          <button
            onClick={stopRecording}
            className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            Stop Recording
          </button>

          {recError && (
            <p className="text-echo-coral text-sm font-nunito mt-3 text-center">{recError}</p>
          )}
        </div>
      )}

      {/* ── PREVIEW PHASE ── */}
      {phase === 'preview' && videoBlob && (
        <div className="px-4">
          <video
            src={URL.createObjectURL(videoBlob)}
            controls
            playsInline
            className="w-full rounded-2xl bg-black mb-4"
            style={{ aspectRatio: '16/9' }}
          />

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            maxLength={100}
            className="w-full bg-white dark:bg-echo-dark-card rounded-xl px-4 py-3 font-inter text-sm text-echo-charcoal dark:text-white border border-echo-light-gray dark:border-white/10 mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={() => { reset(); setPhase('idle'); }}
              className="flex-1 bg-echo-light-gray dark:bg-echo-dark-card text-echo-charcoal dark:text-white font-nunito font-bold text-sm py-3 rounded-full active:scale-95 transition-transform"
            >
              Re-record
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex-1 bg-echo-coral text-white font-nunito font-bold text-sm py-3 rounded-full shadow-coral active:scale-95 transition-transform disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Clip'}
            </button>
          </div>
        </div>
      )}

      {/* ── SAVED CONFIRMATION ── */}
      {phase === 'saved' && (
        <div className="px-4 flex flex-col items-center gap-4 py-8">
          <span className="text-5xl">🎬</span>
          <h2 className="font-nunito font-bold text-xl text-echo-charcoal dark:text-white">Clip saved!</h2>
          <p className="font-inter text-sm text-echo-gray text-center">
            {activeChild.name}'s moment is safely stored.
          </p>
          <button
            onClick={() => setPhase('idle')}
            className="bg-echo-coral text-white font-nunito font-bold text-sm px-8 py-3 rounded-full shadow-coral active:scale-95 transition-transform"
          >
            Back to Videos
          </button>
        </div>
      )}

      {/* ── IDLE PHASE ── */}
      {phase === 'idle' && (
        <div className="px-4">
          {/* Today's clip or record button */}
          {todayClip ? (
            <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✅</span>
                <p className="font-nunito font-bold text-sm text-echo-charcoal dark:text-white">
                  Today's clip captured!
                </p>
              </div>
              <VideoPlayer
                blob={todayClip.videoBlob}
                videoUrl={todayClip.videoUrl}
                userId={state.user?.id}
                videoId={todayClip.id}
              />
              {todayClip.caption && (
                <p className="font-inter text-xs text-echo-gray mt-2">📝 {todayClip.caption}</p>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-6 shadow-soft mb-4 text-center">
              <span className="text-4xl block mb-3">📹</span>
              <p className="font-nunito font-bold text-base text-echo-charcoal dark:text-white mb-1">
                Capture today's moment
              </p>
              <p className="font-inter text-sm text-echo-gray mb-4">
                One 15-second clip of {activeChild.name} — what they're doing right now.
              </p>
              <button
                onClick={() => { setPhase('recording'); void startRecording(); }}
                className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Start Recording
              </button>
            </div>
          )}

          {/* Past clips */}
          {pastClips.length > 0 && (
            <div>
              <h2 className="font-nunito font-bold text-base text-echo-charcoal dark:text-white mb-3">
                Past Clips
              </h2>
              <div className="space-y-3">
                {pastClips.map((clip) => {
                  const dateLabel = new Date(clip.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  });
                  return (
                    <div key={clip.id} className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{activeChild.avatarEmoji}</span>
                          <p className="font-inter text-xs text-echo-gray">{dateLabel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-inter text-xs bg-echo-sky/15 text-echo-sky px-2 py-0.5 rounded-full">
                            {formatDuration(clip.durationSeconds)}
                          </span>
                          <button
                            onClick={() => handleDeleteClip(clip.id, clip.videoUrl)}
                            className="text-echo-gray hover:text-red-500 transition-colors active:scale-95"
                            aria-label="Delete video"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <VideoPlayer
                        blob={clip.videoBlob}
                        videoUrl={clip.videoUrl}
                        userId={state.user?.id}
                        videoId={clip.id}
                      />
                      {clip.caption && (
                        <p className="font-inter text-xs text-echo-gray mt-2">📝 {clip.caption}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
