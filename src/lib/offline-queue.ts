'use client';

// Lightweight offline queue using IndexedDB if available, else localStorage.
// Items are processed when connectivity resumes.

export type QueueItemType = 'pledge' | 'incident';

type BaseQueueItem = {
  id: string;
  type: QueueItemType;
  createdAt: number;
  attempts: number;
};

export type PledgeQueuePayload = {
  name: string;
  contact: string;
  contact_number: string;
  resource_type: string;
  resource_details: string;
  quantity: number;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  location_landmark: string | null;
  pledger_id?: string | null;
};

export type IncidentQueuePayload = {
  status: 'unverified' | 'verified' | 'in_progress' | 'resolved';
  type: string;
  description: string | null;
  photoDataUri: string; // store base64 data URI for offline upload
  audioDataUri?: string | null;
  latitude: number;
  longitude: number;
  notify_department: string | null; // JSON string
  notify_contact: string | null;
};

export type QueueItem = BaseQueueItem & ({
  type: 'pledge';
  payload: PledgeQueuePayload;
} | {
  type: 'incident';
  payload: IncidentQueuePayload;
});

const STORAGE_KEY = 'offlineQueue:v1';
const LAST_SYNC_KEY = 'offlineQueue:lastSync';

function getStore(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStore(items: QueueItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt' | 'attempts'>) {
  const full: QueueItem = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
    ...item,
  } as any;
  const items = getStore();
  items.push(full);
  setStore(items);
  return full.id;
}

export function peekAll(): QueueItem[] {
  return getStore();
}

export function removeById(id: string) {
  const items = getStore().filter(i => i.id !== id);
  setStore(items);
}

export function bumpAttempts(id: string) {
  const items = getStore();
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) {
    items[idx].attempts += 1;
    setStore(items);
  }
}

export function getQueueCount(): number {
  return getStore().length;
}

export type LastSyncInfo = { timestamp: number; processed: number; errors: number } | null;
export function getLastSyncInfo(): LastSyncInfo {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}
function setLastSyncInfo(info: { timestamp: number; processed: number; errors: number }) {
  try {
    localStorage.setItem(LAST_SYNC_KEY, JSON.stringify(info));
  } catch {}
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, data] = dataUri.split(',');
  const isBase64 = /;base64$/.test(header);
  const mimeMatch = header.match(/data:(.*?)(;base64)?$/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  if (isBase64) {
    const byteString = atob(data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mime });
  } else {
    return new Blob([decodeURIComponent(data)], { type: mime });
  }
}

// Process queue items with Supabase when online.
export async function processQueueIfPossible(): Promise<{ processed: number; errors: number; }> {
  const { getSupabaseClient, isSupabaseConfigured } = await import('@/lib/supabase');
  if (!isSupabaseConfigured()) return { processed: 0, errors: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { processed: 0, errors: 0 };

  const supabase = getSupabaseClient();
  const items = getStore();
  let processed = 0;
  let errors = 0;

  for (const item of items) {
    try {
      if (item.type === 'pledge') {
        const payload = { ...item.payload };
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.id) payload.pledger_id = authUser.user.id;
        const { error } = await supabase.from('pledges').insert(payload);
        if (error) throw error;
        removeById(item.id);
        processed++;
      } else if (item.type === 'incident') {
        const bucket = 'incident-photos';
        const photoBlob = dataUriToBlob(item.payload.photoDataUri);
        const path = `reports/${crypto.randomUUID()}-offline.jpg`;
        const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, photoBlob, { upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

        const insertPayload: any = {
          status: item.payload.status,
          type: item.payload.type,
          description: item.payload.description,
          photo_url: pub.publicUrl,
          latitude: item.payload.latitude,
          longitude: item.payload.longitude,
          notify_department: item.payload.notify_department,
          notify_contact: item.payload.notify_contact,
        };

        // Optional audio upload
        if (item.payload.audioDataUri) {
          try {
            const audioBlob = dataUriToBlob(item.payload.audioDataUri);
            const audioPath = `reports/${crypto.randomUUID()}-offline-audio.webm`;
            const { error: audioErr } = await supabase.storage.from(bucket).upload(audioPath, audioBlob, { upsert: false });
            if (!audioErr) {
              const { data: audioPub } = supabase.storage.from(bucket).getPublicUrl(audioPath);
              insertPayload.audio_url = audioPub.publicUrl;
            }
          } catch {
            /* ignore audio upload failure */
          }
        }

        const { error: insertErr } = await supabase.from('incidents').insert(insertPayload);
        if (insertErr) throw insertErr;
        removeById(item.id);
        processed++;
      }
    } catch (e) {
      console.warn('Offline queue sync failed for item', item.id, e);
      bumpAttempts(item.id);
      errors++;
    }
  }

  const summary = { processed, errors };
  setLastSyncInfo({ timestamp: Date.now(), ...summary });
  return summary;
}

export function installOnlineSyncListener() {
  if (typeof window === 'undefined') return;
  const handler = async () => {
    try {
      const res = await processQueueIfPossible();
      if (res.processed > 0) {
        console.info(`Synced ${res.processed} offline item(s).`);
      }
    } catch (e) {
      console.warn('Failed processing offline queue on online event', e);
    }
  };
  window.addEventListener('online', handler);
  // Try once on load
  handler();
}