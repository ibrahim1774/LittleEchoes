import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { getQuestionsForChild, getStreak, getRecordingsByChild } from '@/services/storage';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/questions';
import type { Recording } from '@/types';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Home() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);

  const { parent, activeChild, todayQuestions, streak, user } = state;

  useEffect(() => {
    if (!activeChild) return;

    async function load() {
      if (!activeChild) return;
      // Load questions for today
      const questions = await getQuestionsForChild(activeChild);
      dispatch({ type: 'SET_TODAY_QUESTIONS', payload: questions });

      // Load streak
      const s = await getStreak(activeChild.id);
      dispatch({ type: 'SET_STREAK', payload: s ?? null });

      // Load recent recordings
      const recs = await getRecordingsByChild(activeChild.id);
      setRecentRecordings(recs.slice(0, 3));
    }

    void load();
  }, [activeChild, dispatch, state.isOnboarded]);

  if (!parent || !activeChild) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-echo-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24 px-4 pt-6">
      {/* Greeting */}
      <div className="mb-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-nunito font-bold text-2xl text-echo-charcoal dark:text-white">
            Hi, {parent.name}! 👋
          </h1>
          {!user ? (
            <Link
              to="/signin"
              className="font-nunito font-semibold text-xs text-echo-coral border border-echo-coral/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              Sign In
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-full bg-echo-coral/15 flex items-center justify-center">
              <span className="text-xs font-nunito font-bold text-echo-coral">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <p className="font-inter text-echo-gray text-sm mt-0.5">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Child selector — single child for now */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-2 px-3 mb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {state.children.map((child) => (
          <button
            key={child.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_CHILD', payload: child })}
            className={`flex-shrink-0 flex flex-col items-center gap-1 ${
              activeChild.id === child.id ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full bg-echo-cream dark:bg-echo-dark-card flex items-center justify-center text-3xl shadow-soft transition-all ${
                activeChild.id === child.id ? 'ring-4 ring-echo-coral ring-offset-2 scale-105' : ''
              }`}
            >
              {child.avatarEmoji}
            </div>
            <span className="font-nunito text-xs font-semibold text-echo-charcoal dark:text-white">
              {child.name}
            </span>
          </button>
        ))}
      </div>

      {/* Today's prompt card */}
      <div
        className="bg-white dark:bg-echo-dark-card rounded-2xl p-5 shadow-soft mb-4 animate-fade-in"
        style={{ animationDelay: '0.15s' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{activeChild.avatarEmoji}</span>
          <p className="font-nunito font-bold text-echo-charcoal dark:text-white text-base">
            Today's questions for {activeChild.name}
          </p>
        </div>

        {/* Question previews */}
        <div className="space-y-2.5 mb-5">
          {todayQuestions.length > 0 ? (
            todayQuestions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: CATEGORY_COLORS[q.category] }}
                />
                <div className="flex-1">
                  <p className="font-nunito text-echo-charcoal dark:text-white text-sm leading-snug line-clamp-1">
                    {q.text}
                  </p>
                  <p className="font-inter text-echo-gray text-xs mt-0.5">
                    {CATEGORY_LABELS[q.category]}
                  </p>
                </div>
                <span className="font-inter text-xs text-echo-gray font-semibold">Q{i + 1}</span>
              </div>
            ))
          ) : (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 bg-echo-light-gray" />
                <div className="flex-1 h-4 bg-echo-light-gray rounded animate-pulse" />
              </div>
            ))
          )}
        </div>

        {/* Start recording CTA */}
        <button
          onClick={() => navigate('/today')}
          className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral animate-pulse-cta flex items-center justify-center gap-2"
          aria-label="Start recording session"
        >
          🎤 Start Recording
        </button>
      </div>

      {/* Streak banner */}
      <div
        className="rounded-xl px-4 py-3 mb-4 animate-fade-in"
        style={{
          animationDelay: '0.25s',
          backgroundColor: streak && streak.currentStreak > 0 ? '#FFB34715' : '#F0F0F0',
        }}
      >
        {streak && streak.currentStreak > 0 ? (
          <p className="font-nunito font-bold text-echo-orange text-sm">
            🔥 {streak.currentStreak}-day streak! Keep it going!
          </p>
        ) : (
          <p className="font-nunito text-echo-gray text-sm">
            Start your first echo today! ✨
          </p>
        )}
      </div>

      {/* Recent echoes */}
      {recentRecordings.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-nunito font-bold text-echo-charcoal dark:text-white text-base mb-3">
            Recent Memories
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentRecordings.map((rec) => (
              <div
                key={rec.id}
                className="flex-shrink-0 w-44 bg-white dark:bg-echo-dark-card rounded-2xl p-3 shadow-soft"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{activeChild.avatarEmoji}</span>
                  <span className="font-inter text-xs text-echo-gray">
                    {new Date(rec.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="font-nunito text-echo-charcoal dark:text-white text-xs leading-snug line-clamp-2 mb-2">
                  {rec.questionText}
                </p>
                <div className="flex items-center justify-between">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[rec.questionId.split('-')[0]] ?? '#8E8E93' }}
                  />
                  <span className="font-inter text-xs text-echo-gray">
                    {formatDuration(rec.durationSeconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
