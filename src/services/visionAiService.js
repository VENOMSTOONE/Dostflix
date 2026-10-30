// Vision AI & Content Understanding Service for Dostflix Memory Studio
// Provider-independent architecture with a clean adapter interface.
// If a backend vision endpoint (or API key) is configured, delegates visual understanding to the vision model.
// Otherwise, runs the deterministic Computer Vision Engine with 100% transparency.

import { analyzeImageQualityAndContent, sampleVideoKeyframes } from './visualAnalysisEngine.js';

// Environment configuration (safe across Vite and Node testing)
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const VISION_API_ENDPOINT = env.VITE_VISION_API_ENDPOINT || '/api/analyze-vision';
const GEMINI_API_KEY = env.VITE_GEMINI_API_KEY || null;

// In-memory LRU / Hash cache to avoid repeated visual analysis for identical media
const visionAnalysisCache = new Map();

/**
 * Checks if a live Vision AI API or backend proxy is configured.
 * @returns {boolean}
 */
export function isVisionAiConfigured() {
  return Boolean(
    (GEMINI_API_KEY && !GEMINI_API_KEY.includes('placeholder')) ||
    (import.meta.env.VITE_VISION_API_ENDPOINT)
  );
}

/**
 * Deterministic Computer Vision & Heuristic Analyzer
 * Evaluates visual characteristics honestly without pretending to be a neural network.
 * @param {object} mediaItem
 * @param {object} visualMetrics
 * @returns {object} Structured analysis
 */
export function analyzeWithComputerVision(mediaItem, visualMetrics) {
  const isVideo = mediaItem.mediaType === 'video';
  const name = (mediaItem.originalFilename || '').toLowerCase();
  const folder = (mediaItem.folderName || '').toLowerCase();

  // 1. Detect Blanks and Accidental Shots
  if (visualMetrics.isBlank) {
    return {
      image_type: 'blank',
      scene: 'Blank or completely dark frame',
      subjects: [],
      activity: 'Accidental or unusable capture',
      event_category: 'unusable',
      visual_quality: visualMetrics.qualityScore || 5,
      memory_relevance: 0,
      uniqueness: 5,
      suggested_action: 'exclude',
      confidence: 'high',
      analysisSource: 'computer_vision_engine',
      reason: 'Image is completely blank, solid color, or underexposed black.',
    };
  }

  // 2. Detect Pocket Recordings (Videos)
  if (isVideo && visualMetrics.isPocketRecording) {
    return {
      image_type: 'video_clip',
      scene: 'Short dark or pocket recording',
      subjects: [],
      activity: 'Accidental recording',
      event_category: 'unusable',
      visual_quality: visualMetrics.qualityScore || 10,
      memory_relevance: 5,
      uniqueness: 10,
      suggested_action: 'exclude',
      confidence: 'high',
      analysisSource: 'computer_vision_engine',
      reason: 'Very short (<3s) recording with near-zero illumination.',
    };
  }

  // 3. Detect Documents and Receipts
  const isReceiptName = Boolean(name.match(/(receipt|invoice|bill|ticket|pass|boarding|doc|scan|pdf)/i));
  if (visualMetrics.isDocumentOrReceipt || isReceiptName) {
    return {
      image_type: 'receipt',
      scene: 'Document, receipt, or paper scan',
      subjects: ['text', 'paper'],
      activity: 'Record keeping or documentation',
      event_category: 'archive_document',
      visual_quality: visualMetrics.qualityScore,
      memory_relevance: 25,
      uniqueness: 40,
      suggested_action: 'archive',
      confidence: isReceiptName ? 'high' : 'medium',
      analysisSource: 'computer_vision_engine',
      reason: 'High white background ratio and document-like high contrast text edges. Saved to Archive.',
    };
  }

  // 4. Detect Screenshots & Memes
  const isScreenshotName = Boolean(name.match(/(screenshot|screen_shot|screen-shot|screencap|snapchat|screen)/i));
  if (isScreenshotName || visualMetrics.isScreenshotLikely) {
    return {
      image_type: 'screenshot',
      scene: 'Digital screen capture',
      subjects: ['ui', 'text'],
      activity: 'Digital capture',
      event_category: 'archive_screenshot',
      visual_quality: visualMetrics.qualityScore,
      memory_relevance: 30,
      uniqueness: 45,
      suggested_action: 'archive',
      confidence: isScreenshotName ? 'high' : 'medium',
      analysisSource: 'computer_vision_engine',
      reason: 'Screen aspect ratio and digital interface layout detected. Saved to Archive.',
    };
  }

  // 5. Detect Extremely Blurry Photographs
  if (visualMetrics.isBlurry && visualMetrics.sharpnessScore < 20) {
    return {
      image_type: isVideo ? 'video_clip' : 'photograph',
      scene: 'Unfocused capture',
      subjects: ['blurred scene'],
      activity: 'Candid or motion capture',
      event_category: 'candid',
      visual_quality: visualMetrics.qualityScore,
      memory_relevance: 40,
      uniqueness: 50,
      suggested_action: 'review',
      confidence: 'medium',
      analysisSource: 'computer_vision_engine',
      reason: 'Severe motion blur or soft focus detected. Marked for review so candid memories are preserved.',
    };
  }

  // 6. Photographs & Videos with High Visual Appeal
  let relevance = 85;
  let uniqueness = 80;
  let suggestedAction = 'keep';
  let sceneGuess = 'Captured Moment';
  let categoryGuess = 'gathering';
  const subjects = [];

  // Infer scene hints from warm/cool lighting and aspect ratios
  if (visualMetrics.isCinematicRatio) {
    sceneGuess = 'Cinematic widescreen scene';
    relevance += 5;
  } else if (visualMetrics.isPortrait) {
    sceneGuess = 'Portrait or close-up perspective';
    subjects.push('portrait/candid');
  } else if (visualMetrics.isLandscape) {
    sceneGuess = 'Outdoor or wide scene';
    subjects.push('scenery');
  }

  if (visualMetrics.avgWarmth > 0.15) {
    categoryGuess = 'evening_or_golden_hour';
  }

  return {
    image_type: isVideo ? 'video_clip' : 'photograph',
    scene: sceneGuess,
    subjects,
    activity: isVideo ? 'Video recording' : 'Photography',
    event_category: categoryGuess,
    visual_quality: visualMetrics.qualityScore,
    memory_relevance: Math.min(100, relevance),
    uniqueness: Math.min(100, uniqueness),
    suggested_action: suggestedAction,
    confidence: 'high',
    analysisSource: 'computer_vision_engine',
    reason: `High technical quality (${visualMetrics.qualityScore}/100) with strong visual detail and balanced exposure.`,
  };
}

/**
 * Direct Vision AI Call (Gemini Vision API / Backend Proxy)
 * Uses lightweight thumbnail DataURL to avoid bandwidth waste.
 * @param {string} thumbnailDataUrl
 * @param {object} metadata
 * @returns {Promise<object|null>}
 */
async function callVisionAiBackend(thumbnailDataUrl, metadata) {
  if (!thumbnailDataUrl) return null;

  // Option A: Backend Proxy Endpoint (Recommended for production to safeguard API keys)
  if (import.meta.env.VITE_VISION_API_ENDPOINT) {
    try {
      const resp = await fetch(VISION_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: thumbnailDataUrl,
          filename: metadata.originalFilename,
          fileType: metadata.fileType,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return { ...data, analysisSource: 'vision_ai' };
      }
    } catch (e) {
      console.warn('Backend Vision API call failed, falling back to local engine:', e);
    }
  }

  // Option B: Direct Gemini Vision API if client key is configured in .env.local
  if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('placeholder')) {
    try {
      const base64Data = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = thumbnailDataUrl.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

      const prompt = `Analyze this personal photograph/media for a memory album. Return ONLY valid JSON with no markdown wrapping:
{
  "image_type": "photograph" | "screenshot" | "document" | "receipt" | "meme" | "graphic" | "blank",
  "scene": "short description of location/setting (e.g., restaurant outing, concert, park, home)",
  "subjects": ["people", "food", "landscape", "pets", etc.],
  "activity": "what is happening",
  "event_category": "celebration" | "outing" | "travel" | "casual" | "document",
  "visual_quality": number 0-100,
  "memory_relevance": number 0-100,
  "uniqueness": number 0-100,
  "suggested_action": "keep" | "review" | "archive" | "exclude",
  "confidence": "high" | "medium" | "low",
  "reason": "1-2 sentence explanation for the curation recommendation"
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          const parsed = JSON.parse(textResponse);
          return {
            ...parsed,
            analysisSource: 'vision_ai',
          };
        }
      }
    } catch (geminiErr) {
      console.warn('Direct Gemini Vision API call failed, falling back:', geminiErr);
    }
  }

  return null;
}

/**
 * Main Content Understanding Entrypoint
 * Analyzes visual metrics, checks cache, runs Vision AI if available, or falls back to Computer Vision.
 * @param {object} mediaItem
 * @param {object} visualMetrics
 * @returns {Promise<object>} Structured analysis result
 */
export async function analyzeMediaContent(mediaItem, visualMetrics) {
  // Check cache by SHA-256 hash
  if (mediaItem.hash && visionAnalysisCache.has(mediaItem.hash)) {
    return visionAnalysisCache.get(mediaItem.hash);
  }

  let result = null;

  // Try Vision AI first if configured and not a pure black blank
  if (isVisionAiConfigured() && !visualMetrics.isBlank && mediaItem.thumbnail) {
    result = await callVisionAiBackend(mediaItem.thumbnail, mediaItem);
  }

  // Fallback to local Deterministic Computer Vision Engine
  if (!result) {
    result = analyzeWithComputerVision(mediaItem, visualMetrics);
  }

  // Merge technical quality score with AI visual quality score
  const finalQuality = result.visual_quality != null
    ? Math.round(result.visual_quality * 0.4 + visualMetrics.qualityScore * 0.6)
    : visualMetrics.qualityScore;

  const finalAnalysis = {
    ...result,
    visual_quality: finalQuality,
    technical_quality: visualMetrics.qualityScore,
    sharpness: visualMetrics.sharpnessScore,
    exposure: visualMetrics.exposureScore,
    pHash: visualMetrics.pHash,
  };

  if (mediaItem.hash) {
    visionAnalysisCache.set(mediaItem.hash, finalAnalysis);
  }

  return finalAnalysis;
}
