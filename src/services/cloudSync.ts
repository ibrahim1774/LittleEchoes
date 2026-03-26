import { supabase } from './supabase';
import { db } from './db';
import type { AuthUser } from '@/types';

const STORAGE_BUCKET = 'recordings';

/**
 * Upload parent profile, children, and recordings to Supabase.
 * Audio blobs are uploaded to Supabase Storage; metadata to the recordings table.
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

    // Sync recordings — upload audio blobs to Storage + metadata to DB
    const recordings = await db.recordings.toArray();
    if (recordings.length > 0) {
      const rows = [];
      for (const r of recordings) {
        // Upload audio blob to Supabase Storage if it exists and hasn't been uploaded yet
        let audioUrl = r.audioUrl;
        if (r.audioBlob && !audioUrl) {
          const path = `${user.id}/${r.id}.webm`;
          const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, r.audioBlob, {
              contentType: 'audio/webm',
              upsert: true,
            });
          if (!error) {
            audioUrl = path;
            // Save the URL back to local IndexedDB so we don't re-upload
            await db.recordings.update(r.id, { audioUrl: path });
          }
        }

        rows.push({
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
            audioUrl,
          }),
          created_at: r.createdAt,
        });
      }
      await supabase.from('recordings').upsert(rows);
    }

    // Sync sessions so calendar view works on new devices
    const sessions = await db.sessions.toArray();
    if (sessions.length > 0) {
      const sessionRows = sessions.map((s) => ({
        id: s.id,
        user_id: user.id,
        data: JSON.stringify(s),
        created_at: s.createdAt,
      }));
      await supabase.from('sessions').upsert(sessionRows);
    }
  } catch {
    // Sync is best-effort — don't block the app
  }
}

/**
 * Load profile, children, and recordings from Supabase into local IndexedDB.
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

    // Restore recording metadata + audio URL references
    const { data: recordings } = await supabase
      .from('recordings')
      .select('id, data, created_at')
      .eq('user_id', user.id);

    if (recordings && recordings.length > 0) {
      for (const row of recordings) {
        const meta = JSON.parse(row.data as string);
        // Only restore if we don't already have this recording locally (preserve local blob)
        const existing = await db.recordings.get(row.id);
        if (!existing) {
          await db.recordings.put({
            id: row.id,
            ...meta,
          });
        }
      }
    }

    // Restore sessions so calendar view works
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, data, created_at')
      .eq('user_id', user.id);

    if (sessions && sessions.length > 0) {
      for (const row of sessions) {
        const sessionData = JSON.parse(row.data as string);
        const existing = await db.sessions.get(row.id);
        if (!existing) {
          await db.sessions.put(sessionData);
        }
      }
    }
  } catch {
    // Best-effort
  }
}

/**
 * Delete a recording from Supabase (both metadata row and audio file in Storage).
 */
export async function deleteRecordingFromCloud(
  user: AuthUser,
  recordingId: string,
  audioUrl?: string
): Promise<void> {
  try {
    await supabase.from('recordings').delete().eq('id', recordingId).eq('user_id', user.id);
    if (audioUrl) {
      await supabase.storage.from(STORAGE_BUCKET).remove([audioUrl]);
    }
  } catch {
    // Best-effort
  }
}

/**
 * Download an audio recording from Supabase Storage.
 * Used when playing back recordings on a device that doesn't have the local blob.
 */
export async function downloadAudioFromCloud(audioUrl: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(audioUrl);
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
