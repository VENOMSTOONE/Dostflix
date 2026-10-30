// Visual Analysis & Computer Vision Engine for Dostflix Memory Studio
// Performs client-side perceptual hashing, sharpness/blur assessment, exposure scoring,
// color metrics, and document/screenshot detection with zero external server dependencies.

/**
 * Computes 64-bit Difference Hash (dHash) for an image or canvas.
 * Highly robust against resizing, JPEG compression, minor color grading, and format conversion.
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} source
 * @returns {string} 16-character hexadecimal hash
 */
export function computeDHashFromCanvas(canvas) {
  const width = 9;
  const height = 8;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = width;
  sampleCanvas.height = height;
  const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height).data;
  // Convert 9x8 to grayscale values
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // 8 rows x 8 comparisons = 64 bits
  let binaryString = '';
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < 8; col++) {
      const left = gray[row * width + col];
      const right = gray[row * width + col + 1];
      binaryString += left > right ? '1' : '0';
    }
  }

  // Convert 64-bit binary string to 16 hex characters
  let hexHash = '';
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryString.substring(i, i + 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }
  return hexHash;
}

/**
 * Calculate Hamming Distance between two 64-bit hex perceptual hashes.
 * Distance 0 = Identical image
 * Distance 1-6 = Near-duplicate (resized, recompressed, format converted)
 * Distance 7-12 = Visually very similar (burst photo, minor angle change)
 * Distance > 16 = Substantially different images
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number} Hamming distance in bits (0 to 64)
 */
export function calculateHammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const valA = parseInt(hashA[i], 16);
    const valB = parseInt(hashB[i], 16);
    let xor = valA ^ valB;
    // Count set bits in 4-bit nibble
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Compute Laplacian variance on a grayscale canvas.
 * Higher variance = sharp edges and crisp detail.
 * Low variance (< 80) = blurry, out-of-focus, or motion-blurred image.
 * @param {ImageData} imageData
 * @returns {number} Blur variance metric
 */
export function computeLaplacianVariance(imageData) {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);

  // Convert to grayscale
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Apply discrete 3x3 Laplacian operator: [0, 1, 0; 1, -4, 1; 0, 1, 0]
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

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, variance);
}

/**
 * Comprehensive Technical Quality & Visual Characteristics Analysis
 * Analyzes sharpness, exposure, contrast, color saturation, and document patterns.
 * @param {HTMLCanvasElement|HTMLImageElement} imageSource
 * @param {number} originalWidth
 * @param {number} originalHeight
 * @returns {object} Quality scores and classifications
 */
export async function analyzeImageQualityAndContent(imageSource, originalWidth = 0, originalHeight = 0) {
  // Normalize analysis canvas to max 400px width/height for fast, deterministic evaluation
  const targetDimension = 360;
  const srcW = imageSource.naturalWidth || imageSource.videoWidth || imageSource.width || originalWidth || 400;
  const srcH = imageSource.naturalHeight || imageSource.videoHeight || imageSource.height || originalHeight || 300;

  let canvasW = srcW;
  let canvasH = srcH;
  if (srcW > targetDimension || srcH > targetDimension) {
    if (srcW > srcH) {
      canvasW = targetDimension;
      canvasH = Math.max(1, Math.round((srcH / srcW) * targetDimension));
    } else {
      canvasH = targetDimension;
      canvasW = Math.max(1, Math.round((srcW / srcH) * targetDimension));
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imageSource, 0, 0, canvasW, canvasH);

  // 1. Compute perceptual hash
  const pHash = computeDHashFromCanvas(canvas);

  // 2. Read pixel data
  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imageData.data;
  const totalPixels = canvasW * canvasH;

  // 3. Sharpness calculation
  const laplacianVar = computeLaplacianVariance(imageData);
  // Normalize sharpness score (0 to 100): <50 is very blurry, 120-300 is sharp, >500 is ultra crisp
  let sharpnessScore = Math.min(100, Math.round((Math.sqrt(laplacianVar) / 22) * 100));
  if (laplacianVar < 25) sharpnessScore = Math.max(5, Math.round(sharpnessScore * 0.4));
  const isBlurry = laplacianVar < 45;

  // 4. Exposure & Luminance metrics
  let totalLuminance = 0;
  let totalLuminanceSq = 0;
  let underexposedCount = 0; // pure dark shadows < 20
  let overexposedCount = 0;  // blown out highlights > 235
  let totalSaturation = 0;
  let totalWarmth = 0;
  let nearWhiteCount = 0; // for receipts/documents (> 220)

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;
    totalLuminanceSq += lum * lum;

    if (lum < 20) underexposedCount++;
    if (lum > 235) overexposedCount++;
    if (lum > 220 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) nearWhiteCount++;

    // Color saturation
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
    totalSaturation += sat;

    // Warmth: positive for warm golden/amber, negative for cool blues
    totalWarmth += (r - b) / 255;
  }

  const meanLuminance = totalLuminance / totalPixels;
  const luminanceVariance = Math.max(0, (totalLuminanceSq / totalPixels) - (meanLuminance * meanLuminance));
  const luminanceStdDev = Math.sqrt(luminanceVariance);
  const avgSaturation = totalSaturation / totalPixels;
  const avgWarmth = totalWarmth / totalPixels;

  const underexposedRatio = underexposedCount / totalPixels;
  const overexposedRatio = overexposedCount / totalPixels;
  const whiteRatio = nearWhiteCount / totalPixels;

  // Exposure score (0-100): best when mean luminance is between 90 and 165 with high dynamic range
  let exposureScore = 85;
  if (meanLuminance < 40) {
    // Very dark image
    exposureScore = Math.max(10, Math.round((meanLuminance / 40) * 45));
  } else if (meanLuminance > 220) {
    // Blown out image
    exposureScore = Math.max(15, Math.round((255 - meanLuminance) * 2));
  } else {
    // Penalize extreme clipping
    if (underexposedRatio > 0.45) exposureScore -= Math.round(underexposedRatio * 40);
    if (overexposedRatio > 0.40) exposureScore -= Math.round(overexposedRatio * 40);
  }
  exposureScore = Math.max(10, Math.min(100, exposureScore));

  const isDark = meanLuminance < 45 && underexposedRatio > 0.5;
  const isBlownOut = meanLuminance > 225 && overexposedRatio > 0.55;
  const isBlank = (underexposedRatio > 0.96) || (overexposedRatio > 0.96) || (luminanceStdDev < 6);

  // 5. Resolution & Aspect Ratio detail
  const effectiveW = originalWidth || srcW;
  const effectiveH = originalHeight || srcH;
  const megapixels = (effectiveW * effectiveH) / 1000000;
  let resolutionScore = 50;
  if (megapixels >= 8) resolutionScore = 95;
  else if (megapixels >= 3) resolutionScore = 85;
  else if (megapixels >= 1) resolutionScore = 70;
  else if (megapixels >= 0.5) resolutionScore = 55;
  else resolutionScore = 35;

  const aspectRatio = effectiveH > 0 ? (effectiveW / effectiveH) : 1.33;
  const isLandscape = aspectRatio >= 1.2;
  const isPortrait = aspectRatio <= 0.85;
  const isCinematicRatio = aspectRatio >= 1.5 && aspectRatio <= 2.2;

  // 6. Document / Receipt / Screenshot Heuristics
  // Documents: >60% bright white background, very low saturation (<0.14), high edge frequency
  const isDocumentOrReceipt = whiteRatio > 0.55 && avgSaturation < 0.16 && laplacianVar > 40;
  // Typical screenshots: precise 16:9 (1.777) or modern mobile (19.5:9 ~2.16 or 0.46) with uniform navigation bars
  const isTypicalScreenAspect = Math.abs(aspectRatio - 1.777) < 0.05 || 
                                Math.abs(aspectRatio - 0.562) < 0.05 || 
                                Math.abs(aspectRatio - 0.46) < 0.06;
  const isScreenshotLikely = isTypicalScreenAspect && (whiteRatio > 0.45 || (underexposedRatio > 0.35 && avgSaturation < 0.22));

  // 7. Overall Composite Quality Score (0 - 100)
  let qualityScore = Math.round(
    sharpnessScore * 0.45 +
    exposureScore * 0.35 +
    resolutionScore * 0.20
  );
  if (isBlank) qualityScore = 5;
  if (isBlurry) qualityScore = Math.min(qualityScore, 48);

  return {
    pHash,
    sharpnessScore,
    laplacianVariance: Math.round(laplacianVar),
    isBlurry,
    exposureScore,
    meanLuminance: Math.round(meanLuminance),
    luminanceStdDev: Math.round(luminanceStdDev),
    isDark,
    isBlownOut,
    isBlank,
    avgSaturation: parseFloat(avgSaturation.toFixed(3)),
    avgWarmth: parseFloat(avgWarmth.toFixed(3)),
    megapixels: parseFloat(megapixels.toFixed(2)),
    aspectRatio: parseFloat(aspectRatio.toFixed(3)),
    isLandscape,
    isPortrait,
    isCinematicRatio,
    isDocumentOrReceipt,
    isScreenshotLikely,
    qualityScore: Math.max(1, Math.min(100, qualityScore)),
  };
}

/**
 * Sample Keyframes from a Video file to analyze visual quality and detect accidental recordings.
 * Samples up to 3 frames across video runtime (15%, 50%, 85%).
 * @param {File|Blob} videoBlob
 * @returns {Promise<object>} Video visual analysis
 */
export async function sampleVideoKeyframes(videoBlob) {
  if (typeof window === 'undefined') {
    return {
      pHash: '0000000000000000',
      qualityScore: 70,
      isPocketRecording: false,
      isBlurry: false,
      duration: 0,
      sampledFrames: 0,
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(videoBlob);
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    let isDone = false;
    const cleanup = () => {
      if (isDone) return;
      isDone = true;
      video.pause();
      video.removeAttribute('src');
      video.load();
      try { URL.revokeObjectURL(objectUrl); } catch (_) {}
    };

    // Safety timeout after 10s
    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        pHash: '0000000000000000',
        qualityScore: 65,
        isPocketRecording: false,
        isBlurry: false,
        duration: 0,
        sampledFrames: 0,
      });
    }, 10000);

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve({
        pHash: '0000000000000000',
        qualityScore: 50,
        isPocketRecording: false,
        isBlurry: false,
        duration: 0,
        sampledFrames: 0,
      });
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 0;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;

        // Sample points
        const targetTimes = duration > 2
          ? [Math.max(0.2, duration * 0.15), duration * 0.50, Math.min(duration - 0.2, duration * 0.85)]
          : [Math.min(0.5, duration * 0.5)];

        const keyframeAnalyses = [];

        for (const time of targetTimes) {
          await new Promise((resSeek) => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resSeek();
            };
            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = Math.min(duration, Math.max(0, time));
          });

          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 400);
          canvas.height = Math.round((canvas.width / width) * height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const analysis = await analyzeImageQualityAndContent(canvas, width, height);
          keyframeAnalyses.push(analysis);
        }

        clearTimeout(timeout);
        cleanup();

        if (keyframeAnalyses.length === 0) {
          return resolve({
            pHash: '0000000000000000',
            qualityScore: 70,
            isPocketRecording: false,
            isBlurry: false,
            duration,
            sampledFrames: 0,
          });
        }

        // Average scores across keyframes
        const avgQuality = Math.round(keyframeAnalyses.reduce((acc, k) => acc + k.qualityScore, 0) / keyframeAnalyses.length);
        const avgLum = Math.round(keyframeAnalyses.reduce((acc, k) => acc + k.meanLuminance, 0) / keyframeAnalyses.length);
        const isPocketRecording = (duration < 3.5 && avgLum < 25) || keyframeAnalyses.every(k => k.isBlank);
        const isBlurry = keyframeAnalyses.every(k => k.isBlurry);

        // Pick mid-frame pHash as primary video perceptual hash
        const midIdx = Math.floor(keyframeAnalyses.length / 2);
        const pHash = keyframeAnalyses[midIdx]?.pHash || '0000000000000000';

        resolve({
          pHash,
          qualityScore: avgQuality,
          isPocketRecording,
          isBlurry,
          duration,
          width,
          height,
          meanLuminance: avgLum,
          sampledFrames: keyframeAnalyses.length,
        });
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        resolve({
          pHash: '0000000000000000',
          qualityScore: 60,
          isPocketRecording: false,
          isBlurry: false,
          duration: 0,
          sampledFrames: 0,
        });
      }
    };

    video.src = objectUrl;
  });
}

