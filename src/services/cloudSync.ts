import { supabase } from './supabase';
import { db } from './db';
import type { AuthUser } from '@/types';

/**
 * Upload parent profile + children to Supabase.
 * Recordings are large (audio blobs) — we only sync metadata, not blobs.
 */
export async function syncToCloud(user: AuthUser): Promise<void> {
  try {
    const parent = await db.parents.toArray().then((a) => a[0]);
    const children = parent ? await db.children.where('parentId').equals(parent.id).toArray() : [];

    if (!parent) return;

    await supabase.from('profiles').upsert({
      id: user.id,
      parent: JSON.stringify(parent),
      children: JSON.stringify(children),
    });

    // Sync recording metadata (no blobs — too large for cloud)
    const recordings = await db.recordings.toArray();
    if (recordings.length > 0) {
      const rows = recordings.map((r) => ({
        id: r.id,
        user_id: user.id,
        data: JSON.stringify({
          sessionId: r.sessionId,
          childId: r.childId,
          questionId: r.questionId,
          questionText: r.questionText,
          durationSeconds: r.durationSeconds,
          transcription: r.transcription,
          emotionTag: r.emotionTag,
          parentNote: r.parentNote,
          createdAt: r.createdAt,
        }),
        created_at: r.createdAt,
      }));
      await supabase.from('recordings').upsert(rows);
    }
  } catch {
    // Sync is best-effort — don't block the app
  }
}

/**
 * Load profile + children from Supabase and merge into local IndexedDB.
 * Called after sign-in so returning users see their data on a new device.
 */
export async function loadFromCloud(user: AuthUser): Promise<void> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('parent, children')
      .eq('id', user.id)
      .single();

    if (!data) return;

    if (data.parent) {
      const parent = JSON.parse(data.parent as string);
      await db.parents.put(parent);
    }
    if (data.children) {
      const children = JSON.parse(data.children as string);
      for (const child of children) {
        await db.children.put(child);
      }
    }
  } catch {
    // Best-effort
  }
}
