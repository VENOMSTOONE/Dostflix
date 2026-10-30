// Media Processor for Dostflix Memory Studio
// Handles hashing, lightweight thumbnail generation, video poster capture, and controlled concurrency.

import { extractFileMetadata } from './exifReader';
import { findMediaByHash, saveMediaFile } from './indexedDbStorage';

// Compute SHA-256 hash using native Web Crypto API
export async function computeFileHash(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Crypto subtle hash failed, using fallback:', err);
    // Fallback: fast hash based on size + lastModified + name
    return `hash_${file.size}_${file.lastModified}_${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
}

// Generate a lightweight thumbnail (max 360px) from an Image File
export function generateImageThumbnail(file, maxDimension = 360) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;
      let targetW = width;
      let targetH = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          targetW = maxDimension;
          targetH = Math.round((height / width) * maxDimension);
        } else {
          targetH = maxDimension;
          targetW = Math.round((width / height) * maxDimension);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({
        thumbnail: thumbnailDataUrl,
        width,
        height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        thumbnail: null,
        width: 0,
        height: 0,
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
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        thumbnail: null,
        duration: 0,
        width: 0,
        height: 0,
      });
    }, 6000); // 6s safety timeout

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;

      // Seek to 1s or 25% of video to capture a meaningful frame
      const seekTime = Math.min(1.0, duration * 0.25);
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
            targetH = Math.round((targetH / targetW) * maxDimension);
            targetW = maxDimension;
          } else {
            targetW = Math.round((targetW / targetH) * maxDimension);
            targetH = maxDimension;
          }
        }

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, targetW, targetH);
        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        console.warn('Failed to snapshot video poster:', e);
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
      });
    };

    video.src = objectUrl;
  });
}

// Process a single file: extract metadata, hash, create thumbnail, check duplicate
export async function processFileItem(file, onProgress) {
  const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|m4v)$/i);
  const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpe?g|png|webp|heic)$/i);

  onProgress?.({ stage: 'hashing', percent: 20 });
  const hash = await computeFileHash(file);

  // Check for duplicates in local store
  const existingWithHash = await findMediaByHash(hash);
  const isDuplicate = Boolean(existingWithHash && existingWithHash.length > 0);

  onProgress?.({ stage: 'metadata', percent: 50 });
  const metadata = await extractFileMetadata(file);

  onProgress?.({ stage: 'thumbnail', percent: 80 });
  let visualInfo = { thumbnail: null, width: 0, height: 0, duration: 0 };

  if (isImage) {
    visualInfo = await generateImageThumbnail(file);
  } else if (isVideo) {
    visualInfo = await generateVideoPoster(file);
  }

  const mediaItem = {
    id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    originalFilename: file.name,
    fileType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    mediaType: isVideo ? 'video' : 'image',
    fileSize: file.size,
    hash,
    isDuplicate,
    duplicateOfId: isDuplicate ? existingWithHash[0].id : null,
    // File blob stored directly in IndexedDB
    fileBlob: file,
    // Lightweight thumbnail DataURL for fast rendering
    thumbnail: visualInfo.thumbnail,
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
    status: 'ready', // 'ready' | 'processing' | 'error'
    uploadedAt: new Date().toISOString(),
  };

  onProgress?.({ stage: 'saving', percent: 95 });
  await saveMediaFile(mediaItem);

  onProgress?.({ stage: 'completed', percent: 100 });
  return mediaItem;
}

// Controlled Concurrency Batch Processor
// Processes `concurrencyLimit` files in parallel so 100+ files won't freeze the browser
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

        // Check if all items in queue are completed or errored
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
      item.stage = 'done';
      item.result = result;
      this.onItemComplete?.(item, result);
    } catch (err) {
      item.status = 'error';
      item.error = err.message || 'Processing failed';
      this.onItemError?.(item, err);
    }
  }
}
