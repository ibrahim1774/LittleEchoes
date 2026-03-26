/**
 * Storage Service — IndexedDB implementation via Dexie.
 * All function signatures are designed to be Supabase-compatible:
 * swap the bodies to use supabase.from(...) calls when ready.
 */
import { db } from './db';
import type {
  ParentProfile,
  ChildProfile,
  Question,
  QuestionCategory,
  RecordingSession,
  Recording,
  Streak,
  AgeGroup,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function calcAgeGroup(birthdate: string): AgeGroup {
  const birth = new Date(birthdate);
  const now = new Date();
  const ageMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  const years = Math.floor(ageMonths / 12);
  if (years <= 4) return '3-4';
  if (years <= 6) return '5-6';
  if (years <= 9) return '7-9';
  return '10-12';
}

export { calcAgeGroup };

// ── Parent ────────────────────────────────────────────────────

export async function getParent(): Promise<ParentProfile | undefined> {
  const all = await db.parents.toArray();
  return all[0];
}

export async function saveParent(parent: ParentProfile): Promise<void> {
  await db.parents.put(parent);
}

// ── Children ──────────────────────────────────────────────────

export async function getChildren(parentId: string): Promise<ChildProfile[]> {
  return db.children.where('parentId').equals(parentId).toArray();
}

export async function saveChild(child: ChildProfile): Promise<void> {
  await db.children.put(child);
}

export async function deleteChild(id: string): Promise<void> {
  await db.children.delete(id);
}

// ── Custom Questions ──────────────────────────────────────────

export async function saveCustomQuestion(question: Question): Promise<void> {
  await db.questions.put(question);
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.questions.delete(id);
}

export async function getCustomQuestions(parentId: string): Promise<Question[]> {
  return db.questions.where('createdBy').equals(parentId).toArray();
}

// ── Reset ─────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.parents.clear(),
    db.children.clear(),
    db.sessions.clear(),
    db.recordings.clear(),
    db.streaks.clear(),
    // questions intentionally kept — they are seed data and re-seeded on next open
  ]);
}

// ── Sessions ──────────────────────────────────────────────────

export async function getTodaySession(
  childId: string
): Promise<RecordingSession | undefined> {
  return db.sessions
    .where('[childId+date]')
    .equals([childId, today()])
    .first()
    .catch(() =>
      // fallback if compound index not working
      db.sessions
        .where('childId')
        .equals(childId)
        .and((s) => s.date === today())
        .first()
    );
}

export async function saveSession(session: RecordingSession): Promise<void> {
  await db.sessions.put(session);
}

export async function getSessionsByChild(
  childId: string
): Promise<RecordingSession[]> {
  return db.sessions
    .where('childId')
    .equals(childId)
    .reverse()
    .sortBy('createdAt');
}

// ── Recordings ────────────────────────────────────────────────

export async function saveRecording(recording: Recording): Promise<void> {
  await db.recordings.put(recording);
}

export async function getRecordingsBySession(
  sessionId: string
): Promise<Recording[]> {
  return db.recordings.where('sessionId').equals(sessionId).toArray();
}

export async function getRecordingsByChild(
  childId: string
): Promise<Recording[]> {
  return db.recordings
    .where('childId')
    .equals(childId)
    .reverse()
    .sortBy('createdAt');
}

export async function getRecordingsByQuestion(
  childId: string,
  questionId: string
): Promise<Recording[]> {
  return db.recordings
    .where('childId')
    .equals(childId)
    .and((r) => r.questionId === questionId)
    .sortBy('createdAt');
}

// ── Streaks ───────────────────────────────────────────────────

export async function getStreak(childId: string): Promise<Streak | undefined> {
  return db.streaks.get(childId);
}

export async function updateStreak(childId: string): Promise<Streak> {
  const todayStr = today();
  const existing = await db.streaks.get(childId);

  if (!existing) {
    const streak: Streak = {
      childId,
      currentStreak: 1,
      longestStreak: 1,
      lastRecordingDate: todayStr,
    };
    await db.streaks.put(streak);
    return streak;
  }

  const lastDate = new Date(existing.lastRecordingDate);
  const todayDate = new Date(todayStr);
  const diffDays = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let currentStreak = existing.currentStreak;
  if (diffDays === 0) {
    // already recorded today
  } else if (diffDays === 1) {
    currentStreak += 1;
  } else {
    currentStreak = 1; // streak broken
  }

  const updated: Streak = {
    childId,
    currentStreak,
    longestStreak: Math.max(existing.longestStreak, currentStreak),
    lastRecordingDate: todayStr,
  };
  await db.streaks.put(updated);
  return updated;
}

// ── Question selection ────────────────────────────────────────

export async function getQuestionsForChild(child: ChildProfile): Promise<Question[]> {
  // Check daily cache — same questions all day, new ones tomorrow
  const todayStr = today();
  const cacheKey = `questions-${child.id}-${todayStr}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const ids: string[] = JSON.parse(cached);
      const questions = await Promise.all(ids.map((id) => db.questions.get(id)));
      const valid = questions.filter((q): q is Question => q != null);
      if (valid.length > 0) return valid;
    }
  } catch { /* cache miss — pick fresh */ }

  // Get recently asked questions (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentRecordings = await db.recordings
    .where('childId')
    .equals(child.id)
    .and((r) => new Date(r.createdAt) > fourteenDaysAgo)
    .toArray();

  const recentQuestionIds = new Set(recentRecordings.map((r) => r.questionId));

  // Get all questions matching child's age group
  const allQuestions = await db.questions
    .filter((q) => q.ageGroups.includes(child.ageGroup))
    .toArray();

  // Filter out recently asked
  const eligible = allQuestions.filter((q) => !recentQuestionIds.has(q.id));

  // If not enough eligible, fall back to all age-appropriate questions
  const pool = eligible.length >= 3 ? eligible : allQuestions;

  // Pick one from each of 3 randomly selected categories
  const categories: QuestionCategory[] = [
    'favorites',
    'challenges',
    'emotions',
    'learning',
    'gratitude',
  ];
  const shuffledCats = [...categories].sort(() => Math.random() - 0.5).slice(0, 3);

  const selected: Question[] = [];
  for (const cat of shuffledCats) {
    const catPool = pool.filter((q) => q.category === cat);
    if (catPool.length > 0) {
      const pick = catPool[Math.floor(Math.random() * catPool.length)];
      selected.push(pick);
    }
  }

  // If we didn't get 3, fill from remaining
  if (selected.length < 3) {
    const usedIds = new Set(selected.map((q) => q.id));
    const remaining = pool.filter((q) => !usedIds.has(q.id));
    const extra = remaining
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 - selected.length);
    selected.push(...extra);
  }

  const result = selected.slice(0, 3);

  // Cache today's questions so they persist across sign-in/out
  try {
    localStorage.setItem(cacheKey, JSON.stringify(result.map((q) => q.id)));
  } catch { /* storage full — non-critical */ }

  return result;
}
