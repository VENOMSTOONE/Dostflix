// High-Precision Image Fingerprinting & Perceptual Hashing for Dostflix Memory Studio
// Implements 64-bit DCT pHash (Discrete Cosine Transform), SHA-256, and SSIM verification.
// Decodes all formats (JPG, PNG, WEBP, HEIC) to normalized pixel canvases.

import { isHeicFile } from './exifReader.js';

// Lazy loader for heic-decode
let heicDecodePromise = null;
async function getHeicDecoder() {
  if (typeof window === 'undefined') return null;
  if (!heicDecodePromise) {
    heicDecodePromise = import('heic-decode')
      .then((m) => {
        const fn = typeof m === 'function'
          ? m
          : (typeof m?.default === 'function'
            ? m.default
            : (typeof m?.default?.default === 'function'
              ? m.default.default
              : m?.default || m));
        return fn;
      })
      .catch((err) => {
        heicDecodePromise = null;
        console.warn('heic-decode failed to load in fingerprint engine:', err);
        return null;
      });
  }
  return heicDecodePromise;
}

/**
 * Computes exact SHA-256 hash of original file bytes using Web Crypto API.
 * @param {Blob|File} file
 * @returns {Promise<string>}
 */
export async function computeSha256(file) {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('SHA-256 computation failed, using fallback:', e);
    return `sha_${file.size}_${file.lastModified || 0}_${file.name?.replace(/[^a-zA-Z0-9]/g, '') || ''}`;
  }
}

/**
 * Decodes any image (JPG, PNG, WEBP, HEIC) to an HTMLCanvasElement with normalized pixels.
 * @param {File|Blob} file
 * @param {number} maxDimension
 * @returns {Promise<{ canvas: HTMLCanvasElement, width: number, height: number }>}
 */
export async function normalizeFileToCanvas(file, maxDimension = 360) {
  const isHeic = await isHeicFile(file);

  // Path 1: HEIC / HEIF format
  if (isHeic) {
    const decoder = await getHeicDecoder();
    if (decoder) {
      const buffer = await file.arrayBuffer();
      const { width, height, data } = await decoder({ buffer: new Uint8Array(buffer) });

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

      // Draw full resolution raw image data to temporary canvas
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = width;
      fullCanvas.height = height;
      const fullCtx = fullCanvas.getContext('2d');
      const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
      fullCtx.putImageData(imgData, 0, 0);

      // Scale to normalized dimension
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(fullCanvas, 0, 0, targetW, targetH);

      return { canvas, width, height };
    }
  }

  // Path 2: Standard browser image formats (JPG, PNG, WEBP, etc.)
  // Strategy A: createImageBitmap with automatic EXIF orientation normalization
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      let bitmap;
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch (_) {
        bitmap = await createImageBitmap(file);
      }
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

      return { canvas, width, height };
    } catch (_) {
      // Fallback to Image() if createImageBitmap fails
    }
  }

  // Strategy B: HTMLImageElement without crossOrigin bug
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      try { URL.revokeObjectURL(objectUrl); } catch (_) {}
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Image normalization timed out'));
    }, 6000);

    img.onload = () => {
      clearTimeout(timeout);
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

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);

      cleanup();
      resolve({ canvas, width, height });
    };

    img.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Failed to decode image file'));
    };

    img.src = objectUrl;
  });
}

/**
 * 2D Discrete Cosine Transform (DCT-II) Perceptual Hash (pHash)
 * Scales to 32x32 grayscale, computes DCT, extracts top-left 8x8 low frequencies,
 * and thresholds against median. Highly invariant to resizing, compression, and format conversions.
 * @param {HTMLCanvasElement} sourceCanvas
 * @returns {string} 16-character hexadecimal hash (64 bits)
 */
export function computeDctPHash(sourceCanvas) {
  const size = 32;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = size;
  sampleCanvas.height = size;
  const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceCanvas, 0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size).data;
  // Convert 32x32 to 2D grayscale matrix
  const matrix = [];
  for (let y = 0; y < size; y++) {
    const row = new Float32Array(size);
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      row[x] = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
    }
    matrix.push(row);
  }

  // Precompute 1D DCT cosine basis matrix for 32 points
  const cosMatrix = [];
  for (let u = 0; u < size; u++) {
    const row = new Float32Array(size);
    for (let x = 0; x < size; x++) {
      row[x] = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size));
    }
    cosMatrix.push(row);
  }

  // Compute 2D DCT for the top-left 8x8 frequencies
  const dct = [];
  for (let u = 0; u < 8; u++) {
    const row = new Float32Array(8);
    const alphaU = u === 0 ? 1 / Math.sqrt(size) : Math.sqrt(2 / size);
    for (let v = 0; v < 8; v++) {
      const alphaV = v === 0 ? 1 / Math.sqrt(size) : Math.sqrt(2 / size);
      let sum = 0;
      for (let y = 0; y < size; y++) {
        const cosY = cosMatrix[v][y];
        for (let x = 0; x < size; x++) {
          sum += matrix[y][x] * cosMatrix[u][x] * cosY;
        }
      }
      row[v] = alphaU * alphaV * sum;
    }
    dct.push(row);
  }

  // Extract the 64 low frequencies (excluding DC at 0,0 to ignore overall brightness offset)
  const values = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue; // Skip DC term
      values.push(dct[u][v]);
    }
  }

  // Calculate median of AC coefficients
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Form 64-bit binary string (including DC term comparison against median)
  let binaryString = '';
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      binaryString += dct[u][v] > median ? '1' : '0';
    }
  }

  // Convert to 16 hex chars
  let hexHash = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryString.substring(i, i + 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }

  return hexHash;
}

/**
 * Calculate Hamming Distance between two 64-bit hex perceptual hashes.
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number} Distance in bits (0 to 64)
 */
export function calculateHammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== 16 || hashB.length !== 16) return 64;
  let distance = 0;
  for (let i = 0; i < 16; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Extracts a normalized 32x32 grayscale luminance vector for Structural Similarity (SSIM).
 * @param {HTMLCanvasElement} canvas
 * @returns {Float32Array} 1024 grayscale values
 */
export function extractLuminanceVector(canvas) {
  const size = 32;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = size;
  sampleCanvas.height = size;
  const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size).data;
  const vec = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    vec[i] = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
  }
  return vec;
}

/**
 * Computes Structural Similarity Index (SSIM) between two 32x32 luminance vectors.
 * Returns value between 0.0 (completely dissimilar) and 1.0 (identical structure).
 * @param {Float32Array} vecA
 * @param {Float32Array} vecB
 * @returns {number} SSIM score
 */
export function computeSsimScore(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const N = vecA.length;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < N; i++) {
    sumA += vecA[i];
    sumB += vecB[i];
  }
  const meanA = sumA / N;
  const meanB = sumB / N;

  let varA = 0;
  let varB = 0;
  let covarAB = 0;
  for (let i = 0; i < N; i++) {
    const diffA = vecA[i] - meanA;
    const diffB = vecB[i] - meanB;
    varA += diffA * diffA;
    varB += diffB * diffB;
    covarAB += diffA * diffB;
  }
  varA /= (N - 1);
  varB /= (N - 1);
  covarAB /= (N - 1);

  // Constants to stabilize division with weak denominators
  const c1 = 6.5025; // (0.01 * 255)^2
  const c2 = 58.5225; // (0.03 * 255)^2

  const numerator = (2 * meanA * meanB + c1) * (2 * covarAB + c2);
  const denominator = (meanA * meanA + meanB * meanB + c1) * (varA + varB + c2);

  if (denominator === 0) return 0;
  const ssim = numerator / denominator;
  return Math.max(0, Math.min(1.0, ssim));
}

/**
 * Rotates a 32x32 luminance vector by 90, 180, or 270 degrees.
 * @param {Float32Array} vec
 * @param {number} degrees (90, 180, or 270)
 * @returns {Float32Array} Rotated vector
 */
export function rotateLuminanceVector(vec, degrees) {
  if (!vec || degrees === 0) return vec;
  const size = 32;
  const rotated = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcIdx = y * size + x;
      let dstIdx;
      if (degrees === 90) {
        dstIdx = x * size + (size - 1 - y);
      } else if (degrees === 180) {
        dstIdx = (size - 1 - y) * size + (size - 1 - x);
      } else if (degrees === 270) {
        dstIdx = (size - 1 - x) * size + y;
      } else {
        dstIdx = srcIdx;
      }
      rotated[dstIdx] = vec[srcIdx];
    }
  }
  return rotated;
}

/**
 * Computes Structural Similarity Index (SSIM) checking 0, 90, 180, 270 degrees
 * to be fully invariant to EXIF orientation differences across image formats (e.g. HEIC vs JPEG).
 * @param {Float32Array} vecA
 * @param {Float32Array} vecB
 * @returns {number} Best SSIM score across orientations (0.0 to 1.0)
 */
export function computeBestSsimScore(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  const ssim0 = computeSsimScore(vecA, vecB);
  if (ssim0 >= 0.88) return ssim0;

  const ssim90 = computeSsimScore(vecA, rotateLuminanceVector(vecB, 90));
  if (ssim90 >= 0.88) return ssim90;

  const ssim180 = computeSsimScore(vecA, rotateLuminanceVector(vecB, 180));
  if (ssim180 >= 0.88) return ssim180;

  const ssim270 = computeSsimScore(vecA, rotateLuminanceVector(vecB, 270));
  return Math.max(ssim0, ssim90, ssim180, ssim270);
}

/**
 * Normalizes an item or file into a standardized format name:
 * 'HEIC' | 'JPEG' | 'PNG' | 'WEBP' | 'GIF' | 'TIFF' | 'UNKNOWN'
 * @param {object|File} item
 * @returns {string} Standardized format
 */
export function getNormalizedFormat(item) {
  if (!item) return 'UNKNOWN';
  if (item.isHeic) return 'HEIC';

  const type = (item.fileType || item.fileBlob?.type || item.type || '').toLowerCase();
  const name = (item.originalFilename || item.filename || item.name || '').toLowerCase();

  if (type.includes('heic') || type.includes('heif') || name.match(/\.(heic|heif)$/i)) return 'HEIC';
  if (type.includes('png') || name.endsWith('.png')) return 'PNG';
  if (type.includes('webp') || name.endsWith('.webp')) return 'WEBP';
  if (type.includes('jpeg') || type.includes('jpg') || name.match(/\.(jpe?g)$/i)) return 'JPEG';
  if (type.includes('gif') || name.endsWith('.gif')) return 'GIF';
  if (type.includes('avif') || name.endsWith('.avif')) return 'AVIF';
  if (type.includes('tiff') || name.match(/\.(tiff?)$/i)) return 'TIFF';

  return 'JPEG';
}

/**
 * Compute Laplacian variance to assess image sharpness / focus.
 * @param {HTMLCanvasElement} canvas
 * @returns {number} Sharpness metric
 */
export function computeCanvasSharpness(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const center = gray[rowOffset + x];
      const lap =
        gray[rowOffset - width + x] +
        gray[rowOffset + width + x] +
        gray[rowOffset + x - 1] +
        gray[rowOffset + x + 1] -
        4 * center;

      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 50;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, Math.round(variance));
}

/**
 * Generate Complete Image Fingerprint from normalized pixels.
 * @param {File|Blob} file
 * @returns {Promise<object>} Complete fingerprint
 */
export async function generateImageFingerprint(file) {
  // 1. Content byte hash (SHA-256)
  const sha256 = await computeSha256(file);

  // 2. Normalize image to canvas
  let normalized;
  try {
    normalized = await normalizeFileToCanvas(file, 360);
  } catch (err) {
    console.warn(`Failed to normalize "${file.name}":`, err);
    return {
      sha256,
      pHash: '0000000000000000',
      width: 0,
      height: 0,
      aspectRatio: 1.0,
      sharpness: 50,
      luminanceVec: null,
      thumbnailUrl: null,
    };
  }

  const { canvas, width, height } = normalized;

  // 3. 2D DCT pHash
  const pHash = computeDctPHash(canvas);

  // 4. SSIM luminance vector (32x32 = 1024 floats)
  const luminanceVec = extractLuminanceVector(canvas);

  // 5. Sharpness
  const sharpness = computeCanvasSharpness(canvas);

  // 6. Thumbnail DataURL
  const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.82);

  const aspectRatio = height > 0 ? parseFloat((width / height).toFixed(3)) : 1.33;

  return {
    sha256,
    pHash,
    width,
    height,
    aspectRatio,
    sharpness,
    luminanceVec,
    thumbnailUrl,
  };
}
