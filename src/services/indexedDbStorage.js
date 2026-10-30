// Dostflix Memory Studio - IndexedDB Storage Engine
// Provides high-capacity, permanent local client-side storage for original photos, videos, thumbnails, and metadata

const DB_NAME = 'DostFlixStudioDB';
const DB_VERSION = 1;
const MEDIA_STORE = 'media_files';
const DRAFTS_STORE = 'draft_memories';

let dbPromise = null;

export function getDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Media Files Store
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        const mediaStore = db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        mediaStore.createIndex('hash', 'hash', { unique: false });
        mediaStore.createIndex('assignedMemoryId', 'assignedMemoryId', { unique: false });
        mediaStore.createIndex('mediaType', 'mediaType', { unique: false });
        mediaStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        mediaStore.createIndex('captureDate', 'captureDate', { unique: false });
      }

      // Draft Memories Store
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Failed to open DostFlixStudioDB:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

// Active in-memory cache of Blob URLs keyed by media ID
const activeObjectUrls = new Map();

export function createBlobUrl(id, blob) {
  if (!blob) return null;
  if (activeObjectUrls.has(id)) {
    return activeObjectUrls.get(id);
  }
  try {
    const url = URL.createObjectURL(blob);
    activeObjectUrls.set(id, url);
    return url;
  } catch (err) {
    console.warn('Failed to create object URL for blob:', err);
    return null;
  }
}

export function revokeBlobUrl(id) {
  if (activeObjectUrls.has(id)) {
    try {
      URL.revokeObjectURL(activeObjectUrls.get(id));
    } catch (e) {}
    activeObjectUrls.delete(id);
  }
}

// Resolves the best available URL for any media item or string
export function resolveMediaUrl(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;

  // 1. If thumbnail is a valid data URL or HTTP URL, use it
  if (item.thumbnail && (item.thumbnail.startsWith('data:') || item.thumbnail.startsWith('http') || item.thumbnail.startsWith('/'))) {
    return item.thumbnail;
  }

  // 2. If item has previewUrl that is valid
  if (item.previewUrl) return item.previewUrl;

  // 3. If fileBlob exists, generate/retrieve cached blob URL
  if (item.fileBlob) {
    return createBlobUrl(item.id, item.fileBlob);
  }

  return '';
}

// Save a processed media file
export async function saveMediaFile(mediaItem) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.put(mediaItem);

    request.onsuccess = () => resolve(mediaItem);
    request.onerror = (e) => reject(e.target.error);
  });
}

// Bulk save media files
export async function saveMediaFilesBatch(mediaItems) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);

    mediaItems.forEach(item => store.put(item));

    tx.oncomplete = () => resolve(mediaItems);
    tx.onerror = (e) => reject(e.target.error);
  });
}

// Retrieve all media files and attach active blob URLs
export async function getAllMediaFiles() {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE], 'readonly');
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result || []).map(item => {
        // Ensure previewUrl is populated from fileBlob if thumbnail is missing
        if (!item.thumbnail && item.fileBlob) {
          item.previewUrl = createBlobUrl(item.id, item.fileBlob);
          item.thumbnail = item.previewUrl;
        }
        return item;
      });
      resolve(results);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

// Find media by hash (for duplicate detection)
export async function findMediaByHash(hash) {
  if (!hash) return null;
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE], 'readonly');
    const store = tx.objectStore(MEDIA_STORE);
    const index = store.index('hash');
    const request = index.getAll(hash);

    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.length > 0 ? results : null);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

// Update media fields (e.g., assign to memory)
export async function updateMediaFile(id, patch) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error(`Media with ID ${id} not found.`));
        return;
      }
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = (e) => reject(e.target.error);
    };

    getReq.onerror = (e) => reject(e.target.error);
  });
}

// Delete media file by ID
export async function deleteMediaFile(id) {
  revokeBlobUrl(id);
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([MEDIA_STORE], 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}
