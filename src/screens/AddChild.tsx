import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { saveChild, calcAgeGroup } from '@/services/storage';
import { syncToCloud } from '@/services/cloudSync';
import type { ChildProfile } from '@/types';

const CHILD_AVATARS = ['👧', '👦', '🧒', '👶', '🧒‍♀️', '🧒‍♂️', '🦊', '🐰', '🦄', '🐻', '🌟', '🐼'];

function generateId() {
  return crypto.randomUUID();
}

function Confetti() {
  const colors = ['#FF6B6B', '#FFD93D', '#6BC5F8', '#A8E06C', '#C4A1FF', '#FF8FAB'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    spin: Math.random() > 0.5 ? 360 : -360,
    sway: (Math.random() - 0.5) * 120,
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationName: 'confetti-fall',
            animationDuration: '2s',
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

export function AddChild() {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [avatar, setAvatar] = useState('👧');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_ONBOARDED', payload: true });
        // Route guard on /home will redirect to /paywall if unpaid
        navigate('/home', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti, dispatch, navigate, state.user]);

  async function handleAdd() {
    if (!name.trim()) { setError('Please enter a name'); return; }
    if (!birthdate) { setError('Please select a birthdate'); return; }

    const child: ChildProfile = {
      id: generateId(),
      parentId: state.parent?.id ?? '',
      name: name.trim(),
      birthdate,
      ageGroup: calcAgeGroup(birthdate),
      avatarEmoji: avatar,
      schoolName: schoolName.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await saveChild(child);
    dispatch({ type: 'ADD_CHILD', payload: child });
    if (state.user) void syncToCloud(state.user);
    setShowConfetti(true);
  }

  const displayName = name.trim() || 'Your Child';

  return (
    <div className="min-h-screen bg-echo-cream flex flex-col px-6 py-10 overflow-y-auto">
      {showConfetti && <Confetti />}

      <div className="flex-1 flex flex-col gap-6">
        <div className="animate-fade-in">
          <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
            Tell us about your little one
          </h1>
          <p className="font-nunito text-echo-gray text-sm mt-1">
            You can add more children later in Settings.
          </p>
        </div>

        {/* Name input */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <label className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm mb-1.5 block">
            Name
          </label>
          <input
            type="text"
            placeholder="Child's name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            className="w-full bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray dark:border-white/10 rounded-xl px-4 py-3.5 font-nunito text-base text-echo-charcoal dark:text-white placeholder-echo-gray focus:outline-none focus:border-echo-coral transition-colors"
            maxLength={30}
          />
        </div>

        {/* Birthdate */}
        <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <label className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm mb-1.5 block">
            Birthday
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => { setBirthdate(e.target.value); setError(''); }}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray dark:border-white/10 rounded-xl px-4 py-3.5 font-nunito text-base text-echo-charcoal dark:text-white focus:outline-none focus:border-echo-coral transition-colors"
          />
        </div>

        {/* Avatar picker */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm mb-2">
            Pick an avatar
          </p>
          <div className="grid grid-cols-6 gap-2">
            {CHILD_AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={`w-12 h-12 rounded-full bg-white dark:bg-echo-dark-card flex items-center justify-center text-2xl transition-all active:scale-95 ${
                  avatar === emoji
                    ? 'ring-4 ring-echo-coral ring-offset-2 scale-110'
                    : 'shadow-soft'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* School name (optional) */}
        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <label className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm mb-1.5 flex items-center gap-2">
            School / Daycare
            <span className="text-echo-gray font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="Skip if not applicable"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray dark:border-white/10 rounded-xl px-4 py-3.5 font-nunito text-base text-echo-charcoal dark:text-white placeholder-echo-gray focus:outline-none focus:border-echo-coral transition-colors"
            maxLength={60}
          />
        </div>

        {error && (
          <p className="text-echo-coral text-sm font-nunito -mt-2">{error}</p>
        )}

        {/* CTA button */}
        <button
          onClick={handleAdd}
          className="w-full bg-echo-coral text-white font-nunito font-bold text-lg py-4 rounded-full shadow-coral active:scale-95 transition-transform animate-fade-in mt-2"
          style={{ animationDelay: '0.35s' }}
        >
          Add {displayName} 🎉
        </button>
      </div>
    </div>
  );
}
