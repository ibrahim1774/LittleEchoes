import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { saveParent, saveChild, clearAllData } from '@/services/storage';

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function Settings() {
  const { state, dispatch } = useApp();
  const { parent, activeChild, darkMode } = state;

  // Parent name edit
  const [editingParent, setEditingParent] = useState(false);
  const [parentNameDraft, setParentNameDraft] = useState('');
  const parentInputRef = useRef<HTMLInputElement>(null);

  // Child name edit
  const [editingChild, setEditingChild] = useState(false);
  const [childNameDraft, setChildNameDraft] = useState('');
  const childInputRef = useRef<HTMLInputElement>(null);

  // Reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (editingParent) parentInputRef.current?.focus();
  }, [editingParent]);

  useEffect(() => {
    if (editingChild) childInputRef.current?.focus();
  }, [editingChild]);

  async function toggleDarkMode() {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
    if (parent) {
      await saveParent({ ...parent, settings: { ...parent.settings, darkMode: !darkMode } });
    }
  }

  function startEditParent() {
    if (!parent) return;
    setParentNameDraft(parent.name);
    setEditingParent(true);
  }

  async function saveParentName() {
    if (!parent || !parentNameDraft.trim()) return;
    const updated = { ...parent, name: parentNameDraft.trim() };
    await saveParent(updated);
    dispatch({ type: 'SET_PARENT', payload: updated });
    setEditingParent(false);
  }

  function startEditChild() {
    if (!activeChild) return;
    setChildNameDraft(activeChild.name);
    setEditingChild(true);
  }

  async function saveChildName() {
    if (!activeChild || !childNameDraft.trim()) return;
    const updated = { ...activeChild, name: childNameDraft.trim() };
    await saveChild(updated);
    dispatch({ type: 'SET_ACTIVE_CHILD', payload: updated });
    dispatch({
      type: 'SET_CHILDREN',
      payload: state.children.map((c) => (c.id === updated.id ? updated : c)),
    });
    setEditingChild(false);
  }

  async function handleReset() {
    setResetting(true);
    await clearAllData();
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
          ⚙️ Settings
        </h1>
      </div>

      <div className="px-4 space-y-3">

        {/* Parent profile */}
        {parent && (
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
            <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Parent Profile</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-echo-cream dark:bg-echo-dark-bg flex items-center justify-center text-2xl flex-shrink-0">
                {parent.avatarEmoji}
              </div>
              <div className="flex-1 min-w-0">
                {editingParent ? (
                  <div className="space-y-2">
                    <input
                      ref={parentInputRef}
                      value={parentNameDraft}
                      onChange={(e) => setParentNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void saveParentName(); if (e.key === 'Escape') setEditingParent(false); }}
                      className="w-full font-nunito font-bold text-echo-charcoal dark:text-white bg-echo-cream dark:bg-echo-dark-bg border-2 border-echo-coral rounded-xl px-3 py-1.5 text-sm outline-none"
                      placeholder="Your name"
                      maxLength={40}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void saveParentName()}
                        className="bg-echo-coral text-white font-nunito font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingParent(false)}
                        className="font-nunito text-xs text-echo-gray px-2 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-nunito font-bold text-echo-charcoal dark:text-white">{parent.name}</p>
                      <p className="font-inter text-xs text-echo-gray">Parent</p>
                    </div>
                    <button
                      onClick={startEditParent}
                      className="p-2 rounded-xl text-echo-gray hover:text-echo-coral hover:bg-echo-coral/10 transition-colors active:scale-95"
                      aria-label="Edit parent name"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Child profile */}
        {activeChild && (
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
            <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Child</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-echo-cream dark:bg-echo-dark-bg flex items-center justify-center text-2xl flex-shrink-0">
                {activeChild.avatarEmoji}
              </div>
              <div className="flex-1 min-w-0">
                {editingChild ? (
                  <div className="space-y-2">
                    <input
                      ref={childInputRef}
                      value={childNameDraft}
                      onChange={(e) => setChildNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void saveChildName(); if (e.key === 'Escape') setEditingChild(false); }}
                      className="w-full font-nunito font-bold text-echo-charcoal dark:text-white bg-echo-cream dark:bg-echo-dark-bg border-2 border-echo-coral rounded-xl px-3 py-1.5 text-sm outline-none"
                      placeholder="Child's name"
                      maxLength={40}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void saveChildName()}
                        className="bg-echo-coral text-white font-nunito font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingChild(false)}
                        className="font-nunito text-xs text-echo-gray px-2 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-nunito font-bold text-echo-charcoal dark:text-white">{activeChild.name}</p>
                      <p className="font-inter text-xs text-echo-gray">Age group: {activeChild.ageGroup}</p>
                      {activeChild.schoolName && (
                        <p className="font-inter text-xs text-echo-gray">{activeChild.schoolName}</p>
                      )}
                    </div>
                    <button
                      onClick={startEditChild}
                      className="p-2 rounded-xl text-echo-gray hover:text-echo-coral hover:bg-echo-coral/10 transition-colors active:scale-95"
                      aria-label="Edit child name"
                    >
                      <PencilIcon />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Appearance</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm">Dark Mode</p>
              <p className="font-inter text-xs text-echo-gray mt-0.5">Easier on the eyes at night</p>
            </div>
            <button
              onClick={() => void toggleDarkMode()}
              className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-echo-coral' : 'bg-echo-light-gray'}`}
              aria-label="Toggle dark mode"
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Data & Privacy</p>
          <p className="font-nunito text-sm text-echo-charcoal dark:text-white leading-relaxed">
            🔒 All your recordings are stored <strong>locally on this device</strong>. We never access, sell, or train AI on your recordings.
          </p>
          <div className="mt-3 pt-3 border-t border-echo-light-gray dark:border-white/10">
            <p className="font-inter text-xs text-echo-gray">
              Cloud backup — <span className="text-echo-sky">Coming soon (Supabase sync)</span>
            </p>
          </div>
        </div>

        {/* Coming soon */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft opacity-60">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Coming in v2</p>
          <div className="space-y-2">
            {['Custom questions', 'Reminder notifications', 'Export recordings', 'Family sharing'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-echo-light-gray" />
                <p className="font-nunito text-sm text-echo-gray">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-2">About</p>
          <p className="font-nunito text-sm text-echo-gray">LittleEchoes v0.1.0</p>
          <p className="font-nunito text-sm text-echo-gray mt-1">Made with ❤️ for families</p>
        </div>

        {/* Reset */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Reset</p>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 rounded-xl border-2 border-red-400 text-red-500 font-nunito font-bold text-sm active:scale-95 transition-transform"
            >
              Reset Everything
            </button>
          ) : (
            <div className="space-y-3">
              <p className="font-nunito text-sm text-echo-charcoal dark:text-white leading-relaxed">
                ⚠️ This will permanently delete <strong>all profiles, recordings, and memories</strong> from this device. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleReset()}
                  disabled={resetting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-nunito font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
                >
                  {resetting ? 'Deleting...' : 'Yes, delete everything'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-echo-light-gray text-echo-gray font-nunito font-bold text-sm active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
