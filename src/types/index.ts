// ============================================================
// LittleEchoes — TypeScript Interfaces
// Storage: IndexedDB via Dexie (MVP)
// Future: Swap storage.ts to Supabase — types remain the same
// ============================================================

export type AgeGroup = '1-2' | '3-4' | '5-6' | '7-9' | '10-12';
export type QuestionCategory = 'favorites' | 'challenges' | 'emotions' | 'learning' | 'gratitude';
export type EmotionTag = 'happy' | 'silly' | 'thoughtful' | 'shy' | 'excited' | 'sad';
export type QuestionMode = 'fresh' | 'fixed';
export type SessionStatus = 'in-progress' | 'completed';

export interface ParentSettings {
  reminderTime: string; // HH:MM
  reminderDays: string[]; // ['mon','tue','wed','thu','fri']
  darkMode: boolean;
  questionMode: QuestionMode;
  selectedQuestionIds: string[]; // if fixed mode
}

export interface ParentProfile {
  id: string;
  name: string;
  email?: string;
  avatarEmoji: string;
  createdAt: string; // ISO timestamp
  settings: ParentSettings;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  birthdate: string; // YYYY-MM-DD
  ageGroup: AgeGroup;
  avatarEmoji: string;
  schoolName?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  ageGroups: AgeGroup[];
  isCustom: boolean;
  createdBy?: string; // parentId if custom
}

export interface RecordingSession {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  status: SessionStatus;
}

export interface Recording {
  id: string;
  sessionId: string;
  childId: string;
  questionId: string;
  questionText: string; // snapshot at recording time
  audioBlob?: Blob; // present for local recordings
  audioUrl?: string; // Supabase Storage path for cloud recordings
  mimeType?: string; // e.g. 'audio/webm;codecs=opus' or 'audio/mp4'
  durationSeconds: number;
  transcription?: string;
  emotionTag?: EmotionTag;
  parentNote?: string;
  createdAt: string;
}

export interface Streak {
  childId: string;
  currentStreak: number;
  longestStreak: number;
  lastRecordingDate: string; // YYYY-MM-DD
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface TodayProgress {
  sessionId: string;
  questionIndex: number;
  recordings: Recording[];
  flow: 'questions' | 'free';
}

// App state
export interface AppState {
  parent: ParentProfile | null;
  children: ChildProfile[];
  activeChild: ChildProfile | null;
  isOnboarded: boolean;
  darkMode: boolean;
  todayQuestions: Question[];
  todaySession: RecordingSession | null;
  todayProgress: TodayProgress | null;
  streak: Streak | null;
  isLoading: boolean;
  user: AuthUser | null;
}

export type AppAction =
  | { type: 'SET_PARENT'; payload: ParentProfile }
  | { type: 'SET_CHILDREN'; payload: ChildProfile[] }
  | { type: 'ADD_CHILD'; payload: ChildProfile }
  | { type: 'SET_ACTIVE_CHILD'; payload: ChildProfile }
  | { type: 'SET_ONBOARDED'; payload: boolean }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_TODAY_QUESTIONS'; payload: Question[] }
  | { type: 'SET_TODAY_SESSION'; payload: RecordingSession | null }
  | { type: 'SET_STREAK'; payload: Streak | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_TODAY_PROGRESS'; payload: TodayProgress | null };

/*
 * ============================================================
 * SUPABASE SQL SCHEMA (for future migration)
 * ============================================================
 *
 * -- Parents table
 * CREATE TABLE parents (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT NOT NULL,
 *   email TEXT,
 *   avatar_emoji TEXT NOT NULL DEFAULT '👩',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   settings JSONB NOT NULL DEFAULT '{}'
 * );
 *
 * -- Children table
 * CREATE TABLE children (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   birthdate DATE NOT NULL,
 *   age_group TEXT NOT NULL,
 *   avatar_emoji TEXT NOT NULL,
 *   school_name TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Questions table
 * CREATE TABLE questions (
 *   id TEXT PRIMARY KEY,
 *   text TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   age_groups TEXT[] NOT NULL,
 *   is_custom BOOLEAN DEFAULT FALSE,
 *   created_by UUID REFERENCES parents(id)
 * );
 *
 * -- Recording sessions table
 * CREATE TABLE recording_sessions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   child_id UUID REFERENCES children(id) ON DELETE CASCADE,
 *   date DATE NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   status TEXT NOT NULL DEFAULT 'in-progress'
 * );
 *
 * -- Recordings table (audio files in Supabase Storage)
 * CREATE TABLE recordings (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   session_id UUID REFERENCES recording_sessions(id) ON DELETE CASCADE,
 *   child_id UUID REFERENCES children(id) ON DELETE CASCADE,
 *   question_id TEXT REFERENCES questions(id),
 *   question_text TEXT NOT NULL,
 *   audio_url TEXT NOT NULL, -- Supabase Storage URL (replaces Blob)
 *   duration_seconds INTEGER NOT NULL,
 *   transcription TEXT,
 *   emotion_tag TEXT,
 *   parent_note TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Streaks table
 * CREATE TABLE streaks (
 *   child_id UUID PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
 *   current_streak INTEGER DEFAULT 0,
 *   longest_streak INTEGER DEFAULT 0,
 *   last_recording_date DATE
 * );
 * ============================================================
 */
