// Content Classifier, Image Tiering & Best Cover Selection for Dostflix Memory Studio
// Ranks every photograph and video, categorizes into KEEP, REVIEW, ARCHIVE, EXCLUDE,
// and recommends the top 1-3 cinematic cover images.

import { calculateHammingDistance } from './visualAnalysisEngine.js';

/**
 * Classifies an individual media item based on its visual metrics, vision AI analysis, and duplicate state.
 * @param {object} item
 * @param {object} duplicateInfo - from duplicateDetection.js
 * @returns {object} Full classification and scoring
 */
export function classifyMediaItem(item, duplicateInfo = null) {
  const isVideo = item.mediaType === 'video';
  const vm = item.visualMetrics || {};
  const ai = item.visionAnalysis || {};

  // Default baseline scores
  let qualityScore = vm.qualityScore || ai.visual_quality || 60;
  let relevanceScore = ai.memory_relevance != null ? ai.memory_relevance : 75;
  let uniquenessScore = ai.uniqueness != null ? ai.uniqueness : 70;
  let category = 'KEEP'; // 'KEEP' | 'REVIEW' | 'ARCHIVE' | 'EXCLUDE'
  let reason = '';

  // 1. Check for Exact, Format Variant, or Near Duplicate Copies (Highest Exclusion Priority)
  if (duplicateInfo?.isExactDuplicate) {
    category = 'EXCLUDE';
    uniquenessScore = 5;
    relevanceScore = 15;
    reason = duplicateInfo.reason || 'Excluded from memory selection because an exact identical copy is already included.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'duplicate');
  }

  if (duplicateInfo?.isFormatVariant) {
    category = 'EXCLUDE';
    uniquenessScore = 10;
    relevanceScore = 15;
    reason = duplicateInfo.reason || 'Excluded because the same image in another format is selected as best version.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'format_variant');
  }

  if (duplicateInfo?.isNearDuplicate) {
    category = 'EXCLUDE';
    uniquenessScore = 15;
    relevanceScore = 20;
    reason = duplicateInfo.reason || 'Excluded because this photo is nearly identical to another sharper selected photo.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'near_duplicate');
  }

  // 2. Check for Blanks, Accidental Pocket Shots, or Black Frames
  if (vm.isBlank || (isVideo && vm.isPocketRecording)) {
    category = 'EXCLUDE';
    qualityScore = Math.min(qualityScore, 10);
    relevanceScore = 0;
    uniquenessScore = 5;
    reason = isVideo
      ? 'Accidental short pocket recording with near-zero illumination.'
      : 'Blank, pitch black, or solid color image without visual content.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'blank');
  }

  // 3. Check for Documents, Receipts, Tickets, and Paper Scans -> ARCHIVE ONLY
  if (vm.isDocumentOrReceipt || ai.image_type === 'receipt' || ai.image_type === 'document') {
    category = 'ARCHIVE';
    relevanceScore = 25;
    uniquenessScore = 40;
    reason = 'Receipt, ticket, or printed document detected. Retained in your archive without cluttering memory presentations.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'document');
  }

  // 4. Check for Digital Screenshots, Chat Captures & Memes -> ARCHIVE ONLY
  if (vm.isScreenshotLikely || ai.image_type === 'screenshot' || ai.image_type === 'meme') {
    category = 'ARCHIVE';
    relevanceScore = 30;
    uniquenessScore = 45;
    reason = 'Digital UI screenshot or web graphic detected. Stored safely in archive collections.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'screenshot');
  }

  // 5. Check for Secondary Frames in Burst Sequences -> REVIEW
  if (duplicateInfo?.isBurst && !duplicateInfo?.isBurstRecommended) {
    category = 'REVIEW';
    uniquenessScore = 35;
    relevanceScore = 50;
    reason = 'Part of a rapid camera burst sequence. The sharpest frame was selected, but you can include this frame if you prefer.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'burst_secondary');
  }

  // 6. Check for Low Sharpness / Motion Blur -> REVIEW (Never permanently exclude candid moments!)
  if (vm.isBlurry && vm.sharpnessScore < 35) {
    category = 'REVIEW';
    qualityScore = Math.min(qualityScore, 45);
    relevanceScore = 55;
    reason = 'Noticeable blur or soft focus detected. Marked for review so you can decide if the candid memory is worth keeping.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'blurry_candid');
  }

  // 7. Check for Extreme Underexposure or Overexposure -> REVIEW
  if (vm.isDark || vm.isBlownOut) {
    category = 'REVIEW';
    qualityScore = Math.min(qualityScore, 50);
    relevanceScore = 50;
    reason = vm.isDark
      ? 'Image has heavy shadow clipping or low illumination. Flagged for review.'
      : 'Highlights are significantly overexposed. Flagged for review.';
    return createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, 'exposure_flag');
  }

  // 8. High Visual Quality / Meaningful Photograph or Video -> KEEP (Green)
  category = 'KEEP';
  if (vm.megapixels >= 5) uniquenessScore += 10;
  if (vm.isCinematicRatio) relevanceScore += 10;
  if (duplicateInfo?.isBurstRecommended) {
    reason = 'Recommended: Top sharpest frame selected from camera burst sequence.';
  } else if (isVideo) {
    reason = `Recommended video clip (${Math.round(vm.duration || 0)}s) with good visual detail and steady frames.`;
  } else {
    reason = `Strong candidate with high visual clarity (${qualityScore}/100) and balanced composition.`;
  }

  return createClassificationResult(
    category,
    Math.min(100, qualityScore),
    Math.min(100, relevanceScore),
    Math.min(100, uniquenessScore),
    reason,
    'candidate'
  );
}

function createClassificationResult(category, qualityScore, relevanceScore, uniquenessScore, reason, classificationTag) {
  return {
    category, // 'KEEP' | 'REVIEW' | 'ARCHIVE' | 'EXCLUDE'
    qualityScore,
    relevanceScore,
    uniquenessScore,
    reason,
    classificationTag,
    // Color mapping for UI badges
    badgeColor: category === 'KEEP'
      ? 'green'
      : (category === 'REVIEW' ? 'yellow' : (category === 'ARCHIVE' ? 'grey' : 'red')),
    badgeLabel: category === 'KEEP'
      ? 'Recommended'
      : (category === 'REVIEW' ? 'Needs Review' : (category === 'ARCHIVE' ? 'Archive Only' : 'Excluded')),
  };
}

/**
 * Recommend the Best Cover Image for a Memory Cluster.
 * Evaluates all candidates in the memory and ranks up to 3 best cinematic banner options.
 * @param {Array<object>} files
 * @returns {Array<object>} Top 1-3 ranked cover candidates with rationales
 */
export function selectBestCoverCandidates(files) {
  if (!files || files.length === 0) return [];

  // Exclude documents, screenshots, and excluded duplicate copies
  const eligiblePhotos = files.filter((f) => {
    if (f.mediaType === 'video') return false; // Prefer photo for cinematic poster
    const cat = f.classification?.category;
    return cat === 'KEEP' || cat === 'REVIEW';
  });

  if (eligiblePhotos.length === 0) {
    // Fallback: any image
    const anyImage = files.find((f) => f.mediaType !== 'video') || files[0];
    return [{ file: anyImage, score: 50, reason: 'Default primary cover candidate.' }];
  }

  // Score each candidate for cinematic cover appeal
  const scored = eligiblePhotos.map((file) => {
    const vm = file.visualMetrics || {};
    const quality = file.classification?.qualityScore || vm.qualityScore || 60;
    const sharpness = vm.sharpnessScore || 50;
    const exposure = vm.exposureScore || 70;
    const megapixels = vm.megapixels || 2;
    const aspect = vm.aspectRatio || 1.33;

    let score = quality * 0.35 + sharpness * 0.30 + exposure * 0.20;

    // Aspect ratio bonus: Landscape (16:9, 4:3, or cinematic 2.39:1) look best on Dostflix hero cards
    if (aspect >= 1.3 && aspect <= 2.2) {
      score += 15; // Landscape / widescreen bonus
    } else if (aspect >= 0.9 && aspect <= 1.2) {
      score += 5; // Square-ish is acceptable
    } else {
      score -= 10; // Tall vertical portraits can clip heavily on landscape banners
    }

    // High resolution bonus
    if (megapixels >= 6) score += 10;
    else if (megapixels >= 2) score += 5;

    // Reason generation
    const reasons = [];
    if (aspect >= 1.3 && aspect <= 2.2) reasons.push('Cinematic landscape framing');
    if (sharpness > 70) reasons.push('Crisp edge detail');
    if (exposure > 75) reasons.push('Vibrant balanced lighting');
    if (reasons.length === 0) reasons.push('High visual quality');

    return {
      file,
      score: Math.round(score),
      reason: reasons.join(' • '),
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return top 1-3 distinct options
  const topCandidates = [scored[0]];
  for (let i = 1; i < scored.length; i++) {
    if (topCandidates.length >= 3) break;
    const cand = scored[i];
    // Check if visually distinct from already chosen cover candidates
    const isDistinct = topCandidates.every((selected) => {
      if (!selected.file.visualMetrics?.pHash || !cand.file.visualMetrics?.pHash) return true;
      const dist = calculateHammingDistance(selected.file.visualMetrics.pHash, cand.file.visualMetrics.pHash);
      return dist >= 8;
    });
    if (isDistinct) {
      topCandidates.push(cand);
    }
  }

  return topCandidates;
}
