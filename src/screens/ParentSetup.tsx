import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { saveParent } from '@/services/storage';
import { syncToCloud } from '@/services/cloudSync';
import type { ParentProfile } from '@/types';

const PARENT_AVATARS = ['👩', '👨', '👩‍🦱', '👨‍🦱', '👩‍🦰', '👨‍🦰', '🧑', '🧔'];

function generateId() {
  return crypto.randomUUID();
}

export function ParentSetup() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👩');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  async function handleContinue() {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    const parent: ParentProfile = {
      id: generateId(),
      name: name.trim(),
      avatarEmoji: avatar,
      createdAt: new Date().toISOString(),
      settings: {
        reminderTime: '18:00',
        reminderDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        darkMode: false,
        questionMode: 'fresh',
        selectedQuestionIds: [],
      },
    };

    await saveParent(parent);
    dispatch({ type: 'SET_PARENT', payload: parent });
    if (state.user) void syncToCloud(state.user);
    dispatch({ type: 'SET_ONBOARDED', payload: false }); // still need child
    navigate('/setup/child');
  }

  return (
    <div className="min-h-screen bg-echo-cream dot-pattern flex flex-col px-6 py-10 relative overflow-hidden">
      {/* Decorative stars */}
      <div className="absolute top-8 left-4 text-2xl">✨</div>
      <div className="absolute top-10 right-6 text-xl">⭐</div>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="animate-fade-in">
          <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
            What should we call you?
          </h1>
          <p className="font-nunito text-echo-gray text-sm mt-1">
            You're the memory keeper ❤️
          </p>
        </div>

        {/* Name input */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            className="w-full bg-white dark:bg-echo-dark-card border-2 border-echo-light-gray dark:border-white/10 rounded-xl px-4 py-3.5 font-nunito text-base text-echo-charcoal dark:text-white placeholder-echo-gray focus:outline-none focus:border-echo-coral transition-colors"
            maxLength={40}
          />
          {error && <p className="text-echo-coral text-sm mt-1 font-nunito">{error}</p>}
        </div>

        {/* Avatar picker */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="font-nunito font-semibold text-echo-charcoal dark:text-white mb-3">
            Pick your avatar
          </p>
          <div className="flex flex-wrap gap-3">
            {PARENT_AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={`w-14 h-14 rounded-full bg-white dark:bg-echo-dark-card flex items-center justify-center text-2xl transition-all active:scale-95 ${
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

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="w-full bg-echo-coral text-white font-nunito font-bold text-lg py-4 rounded-full shadow-coral active:scale-95 transition-transform animate-fade-in"
          style={{ animationDelay: '0.3s' }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
