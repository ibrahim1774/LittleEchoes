import { supabase } from './supabase';
import { db } from './db';
import type { AuthUser } from '@/types';

const STORAGE_BUCKET = 'recordings';
const VIDEO_BUCKET = 'videos';

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
          const ext = r.mimeType?.includes('wav') ? 'wav' : r.mimeType?.includes('mp4') ? 'mp4' : 'webm';
          const contentType = r.mimeType?.includes('wav') ? 'audio/wav' : r.mimeType?.includes('mp4') ? 'audio/mp4' : 'audio/webm';
          const path = `${user.id}/${r.id}.${ext}`;
          const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, r.audioBlob, {
              contentType,
              upsert: true,
            });
          if (!error) {
            audioUrl = path;
            // Save the URL back to local IndexedDB so we don't re-upload
            await db.recordings.update(r.id, { audioUrl: path });
          } else {
            console.error(`[syncToCloud] Audio upload failed for ${r.id}:`, error.message);
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
            mimeType: r.mimeType,
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

    // Sync videos
    const videos = await db.videos.toArray();
    if (videos.length > 0) {
      const videoRows = [];
      for (const v of videos) {
        let videoUrl = v.videoUrl;
        if (v.videoBlob && !videoUrl) {
          const ext = v.mimeType?.includes('mp4') ? 'mp4' : 'webm';
          const contentType = v.mimeType?.includes('mp4') ? 'video/mp4' : 'video/webm';
          const path = `${user.id}/${v.id}.${ext}`;
          const { error } = await supabase.storage
            .from(VIDEO_BUCKET)
            .upload(path, v.videoBlob, { contentType, upsert: true });
          if (!error) {
            videoUrl = path;
            await db.videos.update(v.id, { videoUrl: path });
          } else {
            console.error(`[syncToCloud] Video upload failed for ${v.id}:`, error.message);
          }
        }
        videoRows.push({
          id: v.id,
          user_id: user.id,
          data: JSON.stringify({
            childId: v.childId,
            date: v.date,
            durationSeconds: v.durationSeconds,
            mimeType: v.mimeType,
            caption: v.caption,
            createdAt: v.createdAt,
            videoUrl,
          }),
          created_at: v.createdAt,
        });
      }
      await supabase.from('videos').upsert(videoRows);
    }
  } catch (err) {
    console.error('[syncToCloud] Sync failed:', err);
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
        } else if (meta.audioUrl && !existing.audioUrl) {
          // Cloud has audioUrl but local doesn't — update it
          await db.recordings.update(row.id, { audioUrl: meta.audioUrl });
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

    // Restore videos
    const { data: cloudVideos } = await supabase
      .from('videos')
      .select('id, data, created_at')
      .eq('user_id', user.id);

    if (cloudVideos && cloudVideos.length > 0) {
      for (const row of cloudVideos) {
        const meta = JSON.parse(row.data as string);
        const existing = await db.videos.get(row.id);
        if (!existing) {
          await db.videos.put({ id: row.id, ...meta });
        } else if (meta.videoUrl && !existing.videoUrl) {
          await db.videos.update(row.id, { videoUrl: meta.videoUrl });
        }
      }
    }
  } catch (err) {
    console.error('[loadFromCloud] Load failed:', err);
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
    if (error) {
      console.error('[downloadAudio] Failed:', audioUrl, error.message);
      return null;
    }
    if (!data) return null;
    return data;
  } catch (err) {
    console.error('[downloadAudio] Exception:', audioUrl, err);
    return null;
  }
}

/**
 * Download a video from Supabase Storage.
 */
export async function downloadVideoFromCloud(videoUrl: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(VIDEO_BUCKET)
      .download(videoUrl);
    if (error) {
      console.error('[downloadVideo] Failed:', videoUrl, error.message);
      return null;
    }
    if (!data) return null;
    return data;
  } catch (err) {
    console.error('[downloadVideo] Exception:', videoUrl, err);
    return null;
  }
}

/**
 * Delete a video from Supabase (metadata + file).
 */
export async function deleteVideoFromCloud(
  user: AuthUser,
  videoId: string,
  videoUrl?: string
): Promise<void> {
  try {
    await supabase.from('videos').delete().eq('id', videoId).eq('user_id', user.id);
    if (videoUrl) {
      await supabase.storage.from(VIDEO_BUCKET).remove([videoUrl]);
    }
  } catch {
    // Best-effort
  }
}
