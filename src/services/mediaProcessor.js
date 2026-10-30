// Media Processor for Dostflix Memory Studio
// Handles hashing, robust thumbnail generation, video poster capture, and controlled concurrency.

import { extractFileMetadata } from './exifReader';
import { findMediaByHash, saveMediaFile, createBlobUrl } from './indexedDbStorage';

// Compute SHA-256 hash using native Web Crypto API
export async function computeFileHash(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Crypto subtle hash failed, using fallback:', err);
    return `hash_${file.size}_${file.lastModified}_${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
}

// Generate a lightweight thumbnail (max 360px) from an Image File
// Uses createImageBitmap first for maximum speed & reliability without DOM image decode race conditions.
export async function generateImageThumbnail(file, maxDimension = 360) {
  // If file is HEIC, native browser decoders typically fail. Detect early.
  const isHeic = file.name.match(/\.(heic|heif)$/i) || file.type.includes('heic') || file.type.includes('heif');
  if (isHeic) {
    return {
      thumbnail: null,
      width: 0,
      height: 0,
      format: 'heic',
      isUnsupportedPreview: true
    };
  }

  // Strategy A: createImageBitmap (Modern, fast, off-main-thread)
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      let targetW = width;
      let targetH = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          targetW = maxDimension;
          targetH = Math.max(1, Math.round((height / width) * maxDimension));
        } else {
          targetH = maxDimension;
          targetW = Math.max(1, Math.round((width / height) * maxDimension));
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      bitmap.close();

      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      return {
        thumbnail: thumbnailDataUrl,
        width,
        height,
        format: file.type || 'image/jpeg',
        isUnsupportedPreview: false
      };
    } catch (err) {
      // createImageBitmap failed (e.g. unusual format), proceed to Strategy B
    }
  }

  // Strategy B: FileReader + HTMLImageElement with natural dimensions & safe revoke
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    let timeoutId = setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnail: null,
        width: 0,
        height: 0,
        format: file.type,
        isUnsupportedPreview: true
      });
    }, 4000);

    img.onload = async () => {
      clearTimeout(timeoutId);

      // Prefer natural dimensions
      const width = img.naturalWidth || img.width || maxDimension;
      const height = img.naturalHeight || img.height || maxDimension;
      let targetW = width;
      let targetH = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          targetW = maxDimension;
          targetH = Math.max(1, Math.round((height / width) * maxDimension));
        } else {
          targetH = maxDimension;
          targetW = Math.max(1, Math.round((width / height) * maxDimension));
        }
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        URL.revokeObjectURL(objectUrl);
        resolve({
          thumbnail: thumbnailDataUrl,
          width,
          height,
          format: file.type,
          isUnsupportedPreview: false
        });
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        resolve({
          thumbnail: null,
          width,
          height,
          format: file.type,
          isUnsupportedPreview: true
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnail: null,
        width: 0,
        height: 0,
        format: file.type,
        isUnsupportedPreview: true
      });
    };

    img.src = objectUrl;
  });
}

// Generate a poster frame and duration from a Video File
export function generateVideoPoster(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    // 2.5s safe timeout so video seeking doesn't stall the queue runner
    const timeout = setTimeout(() => {
      const duration = video.duration || 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      cleanup();
      resolve({
        thumbnail: null,
        duration,
        width,
        height,
        isUnsupportedPreview: true
      });
    }, 2500);

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const seekTime = Math.min(1.0, duration * 0.2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      let thumbnailDataUrl = null;

      try {
        const canvas = document.createElement('canvas');
        const maxDimension = 360;
        let targetW = video.videoWidth || 320;
        let targetH = video.videoHeight || 180;

        if (targetW > maxDimension || targetH > maxDimension) {
          if (targetW > targetH) {
            targetH = Math.max(1, Math.round((targetH / targetW) * maxDimension));
            targetW = maxDimension;
          } else {
            targetW = Math.max(1, Math.round((targetW / targetH) * maxDimension));
            targetH = maxDimension;
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, targetW, targetH);
        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        console.warn('Failed to snapshot video frame:', e);
      }

      const duration = video.duration || 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      cleanup();

      resolve({
        thumbnail: thumbnailDataUrl,
        duration,
        width,
        height,
        isUnsupportedPreview: !thumbnailDataUrl
      });
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve({
        thumbnail: null,
        duration: 0,
        width: 0,
        height: 0,
        isUnsupportedPreview: true
      });
    };

    video.src = objectUrl;
  });
}

// Process a single file: extract metadata, hash, create thumbnail, verify storage
export async function processFileItem(file, onProgress) {
  const isVideo = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|mov|webm|m4v)$/i));
  const isImage = file.type.startsWith('image/') || Boolean(file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i));

  onProgress?.({ stage: 'hashing', percent: 20 });
  const hash = await computeFileHash(file);

  // Check for duplicates in local store
  const existingWithHash = await findMediaByHash(hash);
  const isDuplicate = Boolean(existingWithHash && existingWithHash.length > 0);

  onProgress?.({ stage: 'metadata', percent: 45 });
  const metadata = await extractFileMetadata(file);

  onProgress?.({ stage: 'thumbnail', percent: 70 });
  let visualInfo = { thumbnail: null, width: 0, height: 0, duration: 0, isUnsupportedPreview: false };

  if (isImage) {
    visualInfo = await generateImageThumbnail(file);
  } else if (isVideo) {
    visualInfo = await generateVideoPoster(file);
  }

  const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Create live blob preview URL for immediate session rendering
  const liveBlobUrl = createBlobUrl(mediaId, file);

  const mediaItem = {
    id: mediaId,
    originalFilename: file.name,
    fileType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    mediaType: isVideo ? 'video' : 'image',
    fileSize: file.size,
    hash,
    isDuplicate,
    duplicateOfId: isDuplicate ? existingWithHash[0].id : null,
    // File blob stored directly in IndexedDB for permanent recovery
    fileBlob: file,
    // Live blob URL for this session
    previewUrl: liveBlobUrl,
    // Lightweight thumbnail DataURL for fast rendering
    thumbnail: visualInfo.thumbnail || liveBlobUrl,
    isUnsupportedPreview: visualInfo.isUnsupportedPreview,
    dimensions: {
      width: visualInfo.width,
      height: visualInfo.height,
    },
    duration: visualInfo.duration || 0,
    captureDate: metadata.captureDate,
    captureDateSource: metadata.captureDateSource,
    isVerifiedMetadata: metadata.isVerifiedMetadata,
    cameraMake: metadata.cameraMake,
    cameraModel: metadata.cameraModel,
    gps: metadata.gps,
    folderName: metadata.folderName,
    assignedMemoryId: null,
    isCover: false,
    status: 'stored', // Confirmed stored
    uploadedAt: new Date().toISOString(),
  };

  onProgress?.({ stage: 'storing', percent: 90 });
  
  // Persist directly to IndexedDB
  await saveMediaFile(mediaItem);

  onProgress?.({ stage: 'completed', percent: 100 });
  return mediaItem;
}

// Controlled Concurrency Batch Processor
export class BatchQueueRunner {
  constructor(concurrencyLimit = 3) {
    this.concurrencyLimit = concurrencyLimit;
    this.queue = [];
    this.runningCount = 0;
    this.isPaused = false;
    this.isCancelled = false;
    this.onItemProgress = null;
    this.onItemComplete = null;
    this.onItemError = null;
    this.onAllComplete = null;
  }

  addFiles(files) {
    const newItems = Array.from(files).map((file, idx) => ({
      id: `queue-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      file,
      filename: file.name,
      fileSize: file.size,
      status: 'pending', // 'pending' | 'processing' | 'completed' | 'error' | 'paused'
      progress: 0,
      stage: 'queued',
      result: null,
      error: null,
    }));

    this.queue.push(...newItems);
    this.triggerNext();
    return newItems;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.triggerNext();
  }

  cancel() {
    this.isCancelled = true;
    this.queue = [];
  }

  retryItem(itemId) {
    const item = this.queue.find(i => i.id === itemId);
    if (item && item.status === 'error') {
      item.status = 'pending';
      item.error = null;
      item.progress = 0;
      this.triggerNext();
    }
  }

  removeItem(itemId) {
    const idx = this.queue.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
  }

  async triggerNext() {
    if (this.isPaused || this.isCancelled) return;

    while (this.runningCount < this.concurrencyLimit) {
      const nextItem = this.queue.find(item => item.status === 'pending');
      if (!nextItem) break;

      this.runningCount++;
      nextItem.status = 'processing';
      nextItem.stage = 'starting';

      this.processItem(nextItem).finally(() => {
        this.runningCount--;
        this.triggerNext();

        const allDone = this.queue.every(i => i.status === 'completed' || i.status === 'error');
        if (allDone && this.runningCount === 0 && this.queue.length > 0) {
          this.onAllComplete?.(this.queue);
        }
      });
    }
  }

  async processItem(item) {
    try {
      const result = await processFileItem(item.file, (progress) => {
        item.progress = progress.percent;
        item.stage = progress.stage;
        this.onItemProgress?.(item);
      });

      item.status = 'completed';
      item.progress = 100;
      item.stage = 'stored';
      item.result = result;
      this.onItemComplete?.(item, result);
    } catch (err) {
      item.status = 'error';
      item.error = err.message || 'Storage failed';
      this.onItemError?.(item, err);
    }
  }
}
