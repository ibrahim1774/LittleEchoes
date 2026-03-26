import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  saveParent,
  saveChild,
  clearAllData,
  saveCustomQuestion,
  deleteQuestion,
  getCustomQuestions,
} from '@/services/storage';
import { requestNotificationPermission } from '@/services/notifications';
import type { Question, QuestionCategory, AgeGroup } from '@/types';
import { supabase } from '@/services/supabase';

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}

const CATEGORY_OPTIONS: { value: QuestionCategory; label: string }[] = [
  { value: 'favorites', label: 'Favorites & Fun' },
  { value: 'challenges', label: 'Challenges & Growth' },
  { value: 'emotions', label: 'Emotions & Relationships' },
  { value: 'learning', label: 'Learning & Wonder' },
  { value: 'gratitude', label: 'Gratitude & Reflection' },
];

const AGE_GROUP_OPTIONS: AgeGroup[] = ['3-4', '5-6', '7-9', '10-12'];
const DAY_OPTIONS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS: Record<string, string> = {
  mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'Sa', sun: 'Su',
};

export function Settings() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { parent, activeChild, darkMode, user } = state;

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

  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [reminderDays, setReminderDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);

  // Custom questions
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [newQText, setNewQText] = useState('');
  const [newQCategory, setNewQCategory] = useState<QuestionCategory>('favorites');
  const [newQAgeGroups, setNewQAgeGroups] = useState<AgeGroup[]>(['3-4', '5-6', '7-9', '10-12']);
  const [savingQ, setSavingQ] = useState(false);

  useEffect(() => {
    if (editingParent) parentInputRef.current?.focus();
  }, [editingParent]);

  useEffect(() => {
    if (editingChild) childInputRef.current?.focus();
  }, [editingChild]);

  // Load reminder settings from parent
  useEffect(() => {
    if (parent?.settings) {
      setReminderTime(parent.settings.reminderTime || '18:00');
      setReminderDays((parent.settings.reminderDays?.length ?? 0) > 0 ? parent.settings.reminderDays : ['mon', 'tue', 'wed', 'thu', 'fri']);
      setRemindersEnabled(
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        (parent.settings.reminderDays?.length ?? 0) > 0,
      );
    }
  }, [parent]);

  // Load custom questions
  useEffect(() => {
    if (parent) {
      void getCustomQuestions(parent.id).then(setCustomQuestions);
    }
  }, [parent]);

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

  async function toggleReminders() {
    if (remindersEnabled) {
      setRemindersEnabled(false);
      if (parent) {
        const updated = { ...parent, settings: { ...parent.settings, reminderDays: [] } };
        await saveParent(updated);
        dispatch({ type: 'SET_PARENT', payload: updated });
      }
    } else {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please allow notifications in your browser settings to enable reminders.');
        return;
      }
      setRemindersEnabled(true);
      if (parent) {
        const updated = { ...parent, settings: { ...parent.settings, reminderTime, reminderDays } };
        await saveParent(updated);
        dispatch({ type: 'SET_PARENT', payload: updated });
      }
    }
  }

  async function saveReminderSettings() {
    if (!parent) return;
    const updated = { ...parent, settings: { ...parent.settings, reminderTime, reminderDays } };
    await saveParent(updated);
    dispatch({ type: 'SET_PARENT', payload: updated });
  }

  function toggleReminderDay(day: string) {
    setReminderDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function addCustomQuestion() {
    if (!parent || !newQText.trim() || newQAgeGroups.length === 0) return;
    setSavingQ(true);
    const q: Question = {
      id: `custom-${Date.now()}`,
      text: newQText.trim(),
      category: newQCategory,
      ageGroups: newQAgeGroups,
      isCustom: true,
      createdBy: parent.id,
    };
    await saveCustomQuestion(q);
    setCustomQuestions((prev) => [...prev, q]);
    setNewQText('');
    setSavingQ(false);
  }

  async function removeCustomQuestion(id: string) {
    await deleteQuestion(id);
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    navigate('/');
  }

  function toggleAgeGroup(ag: AgeGroup) {
    setNewQAgeGroups((prev) =>
      prev.includes(ag) ? prev.filter((a) => a !== ag) : [...prev, ag],
    );
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
          Settings
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
                      <button onClick={() => void saveParentName()} className="bg-echo-coral text-white font-nunito font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform">Save</button>
                      <button onClick={() => setEditingParent(false)} className="font-nunito text-xs text-echo-gray px-2 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-nunito font-bold text-echo-charcoal dark:text-white">{parent.name}</p>
                      <p className="font-inter text-xs text-echo-gray">Parent</p>
                    </div>
                    <button onClick={startEditParent} className="p-2 rounded-xl text-echo-gray hover:text-echo-coral hover:bg-echo-coral/10 transition-colors active:scale-95" aria-label="Edit parent name">
                      <PencilIcon />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Child profiles */}
        {state.children.map((child) => (
          <div key={child.id} className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
            <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Child</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-echo-cream dark:bg-echo-dark-bg flex items-center justify-center text-2xl flex-shrink-0">
                {child.avatarEmoji}
              </div>
              <div className="flex-1 min-w-0">
                {editingChild && activeChild?.id === child.id ? (
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
                      <button onClick={() => void saveChildName()} className="bg-echo-coral text-white font-nunito font-bold text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform">Save</button>
                      <button onClick={() => setEditingChild(false)} className="font-nunito text-xs text-echo-gray px-2 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-nunito font-bold text-echo-charcoal dark:text-white">{child.name}</p>
                      <p className="font-inter text-xs text-echo-gray">Age group: {child.ageGroup}</p>
                      {child.schoolName && <p className="font-inter text-xs text-echo-gray">{child.schoolName}</p>}
                    </div>
                    <button
                      onClick={() => { dispatch({ type: 'SET_ACTIVE_CHILD', payload: child }); startEditChild(); }}
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
        ))}

        {/* Add child button */}
        <button
          onClick={() => navigate('/setup/child')}
          className="w-full bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-echo-cream dark:bg-echo-dark-bg flex items-center justify-center text-2xl flex-shrink-0">+</div>
          <p className="font-nunito font-bold text-echo-coral text-sm">Add Another Child</p>
        </button>

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

        {/* Reminders */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Reminders</p>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm">Daily reminder</p>
              <p className="font-inter text-xs text-echo-gray mt-0.5">Get notified to record today's echoes</p>
            </div>
            <button
              onClick={() => void toggleReminders()}
              className={`w-12 h-6 rounded-full transition-colors relative ${remindersEnabled ? 'bg-echo-coral' : 'bg-echo-light-gray'}`}
              aria-label="Toggle reminders"
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${remindersEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {remindersEnabled && (
            <div className="space-y-3 pt-3 border-t border-echo-light-gray dark:border-white/10">
              <div className="flex items-center gap-3">
                <p className="font-inter text-xs text-echo-gray w-12">Time</p>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  onBlur={() => void saveReminderSettings()}
                  className="bg-echo-cream dark:bg-echo-dark-bg font-inter text-sm text-echo-charcoal dark:text-white rounded-xl px-3 py-1.5 outline-none border-2 border-transparent focus:border-echo-coral transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-inter text-xs text-echo-gray w-12">Days</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day}
                      onClick={() => { toggleReminderDay(day); void saveReminderSettings(); }}
                      className={`w-8 h-8 rounded-full font-nunito font-bold text-xs transition-all active:scale-95 ${
                        reminderDays.includes(day)
                          ? 'bg-echo-coral text-white'
                          : 'bg-echo-light-gray text-echo-gray'
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Questions */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Custom Questions</p>

          {/* Existing custom questions */}
          {customQuestions.length > 0 && (
            <div className="space-y-2 mb-4">
              {customQuestions.map((q) => (
                <div key={q.id} className="flex items-start gap-2 bg-echo-cream dark:bg-echo-dark-bg rounded-xl px-3 py-2">
                  <p className="font-nunito text-sm text-echo-charcoal dark:text-white flex-1 leading-snug">{q.text}</p>
                  <button
                    onClick={() => void removeCustomQuestion(q.id)}
                    className="text-echo-gray hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                    aria-label="Delete question"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new question form */}
          <div className="space-y-2.5">
            <textarea
              value={newQText}
              onChange={(e) => setNewQText(e.target.value)}
              placeholder="Write a question to ask your child..."
              rows={2}
              className="w-full bg-echo-cream dark:bg-echo-dark-bg font-nunito text-sm text-echo-charcoal dark:text-white rounded-xl px-3 py-2.5 outline-none border-2 border-transparent focus:border-echo-coral transition-colors resize-none"
              maxLength={200}
            />
            <div className="flex gap-2 items-center">
              <select
                value={newQCategory}
                onChange={(e) => setNewQCategory(e.target.value as QuestionCategory)}
                className="flex-1 bg-echo-cream dark:bg-echo-dark-bg font-inter text-xs text-echo-charcoal dark:text-white rounded-xl px-3 py-2 outline-none border-2 border-transparent focus:border-echo-coral transition-colors"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1.5">
              {AGE_GROUP_OPTIONS.map((ag) => (
                <button
                  key={ag}
                  onClick={() => toggleAgeGroup(ag)}
                  className={`flex-1 py-1.5 rounded-xl font-inter text-xs font-semibold transition-all active:scale-95 ${
                    newQAgeGroups.includes(ag)
                      ? 'bg-echo-coral text-white'
                      : 'bg-echo-light-gray text-echo-gray'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
            <button
              onClick={() => void addCustomQuestion()}
              disabled={!newQText.trim() || newQAgeGroups.length === 0 || savingQ}
              className="w-full py-2.5 rounded-xl bg-echo-coral text-white font-nunito font-bold text-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              {savingQ ? 'Saving...' : '+ Add Question'}
            </button>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Data & Privacy</p>
          <p className="font-nunito text-sm text-echo-charcoal dark:text-white leading-relaxed">
            All your recordings are stored <strong>locally on this device</strong>. We never access, sell, or train AI on your recordings.
          </p>
          {user && (
            <div className="mt-3 pt-3 border-t border-echo-light-gray dark:border-white/10">
              <p className="font-inter text-xs text-echo-gray">
                Cloud sync enabled — signed in as <span className="text-echo-sky">{user.email}</span>
              </p>
            </div>
          )}
        </div>

        {/* About */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-2">About</p>
          <p className="font-nunito text-sm text-echo-gray">LittleEchoes v1.0.0</p>
          <p className="font-nunito text-sm text-echo-gray mt-1">Made with love for families</p>
        </div>

        {/* Account */}
        {user && (
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
            <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Account</p>
            <button
              onClick={() => void handleSignOut()}
              className="w-full py-2.5 rounded-xl border-2 border-echo-gray/30 text-echo-gray font-nunito font-bold text-sm active:scale-95 transition-transform"
            >
              Sign Out
            </button>
          </div>
        )}

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
                This will permanently delete <strong>all profiles, recordings, and memories</strong> from this device. This cannot be undone.
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
