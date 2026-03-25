import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recording } from '@/types';
import { useApp } from '@/context/AppContext';
import { CATEGORY_COLORS } from '@/data/questions';

interface Props {
  recordings: Recording[];
  childName: string;
}

const CONFETTI_COLORS = ['#FF6B6B', '#FFD93D', '#6BC5F8', '#A8E06C', '#C4A1FF', '#FF8FAB'];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 180),
    sway: (Math.random() - 0.5) * 120,
    size: 6 + Math.random() * 10,
    isCircle: Math.random() > 0.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className={`absolute top-0 ${p.isCircle ? 'rounded-full' : 'rounded-sm'}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationName: 'confetti-fall',
            animationDuration: '2.5s',
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-in',
            animationFillMode: 'both',
            '--spin': `${p.spin}deg`,
            '--sway': `${p.sway}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
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

export function SessionComplete({ recordings, childName }: Props) {
  const navigate = useNavigate();
  const { state } = useApp();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-echo-cream to-white dark:from-echo-dark-bg dark:to-echo-dark-card flex flex-col items-center px-6 pt-16 pb-10">
      <Confetti />

      <div className={`flex flex-col items-center w-full transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-bounce-in">🎉</div>
          <h1 className="font-nunito font-extrabold text-3xl text-echo-charcoal dark:text-white">
            Amazing!
          </h1>
          <p className="font-nunito text-echo-gray text-base mt-2">
            You captured {recordings.length} echo{recordings.length !== 1 ? 's' : ''} for {childName} today!
          </p>
        </div>

        {/* Streak update */}
        {state.streak && (
          <div className="bg-echo-orange/10 rounded-xl px-5 py-3 mb-6 text-center">
            <p className="font-nunito font-bold text-echo-orange">
              {state.streak.currentStreak === 1
                ? '🌟 Your first echo!'
                : `🔥 ${state.streak.currentStreak}-day streak!`}
            </p>
          </div>
        )}

        {/* Summary cards */}
        <div className="w-full space-y-3 mb-8">
          {recordings.map((rec, i) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft flex items-start gap-3 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: CATEGORY_COLORS[rec.questionId.split('-')[0]] ?? '#8E8E93' }}
              />
              <div className="flex-1">
                <p className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm leading-snug line-clamp-1">
                  {rec.questionText}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-inter text-xs text-echo-gray">
                    {formatDuration(rec.durationSeconds)}
                  </span>
                  {rec.emotionTag && (
                    <span className="text-sm">{EMOTION_EMOJIS[rec.emotionTag]}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Small illustration */}
        <div className="text-5xl mb-8">
          💕
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-echo-coral text-white font-nunito font-bold text-base py-4 rounded-full shadow-coral active:scale-95 transition-transform"
          >
            🏠 Back Home
          </button>
          <button
            onClick={() => navigate('/memories')}
            className="w-full border-2 border-echo-coral text-echo-coral font-nunito font-bold text-base py-4 rounded-full active:scale-95 transition-transform"
          >
            📖 View in Memories
          </button>
        </div>
      </div>
    </div>
  );
}
