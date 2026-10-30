// Comprehensive 4-Tier Duplicate & Burst Detection Engine for Dostflix Memory Studio
// Tier 1: Exact Duplicates via SHA-256 byte hash.
// Tier 2: Cross-Format Variants (e.g. JPG, PNG, WEBP, HEIC of the exact same image).
// Tier 3: Burst Photo Sequences via Chronological, Camera & Scene Similarity.
// Tier 4: Visual Near-Duplicates (e.g. Resized 4K vs 1080p, heavy compression).
// Full cross-comparison: compares batch items against each other AND against existing vault media.

import { 
  calculateHammingDistance, 
  computeSsimScore, 
  computeBestSsimScore, 
  getNormalizedFormat 
} from './imageFingerprint.js';

/**
 * Extracts a reliable epoch timestamp (ms) from captureDate, lastModified, or metadata.
 * @param {object} item
 * @returns {number|null}
 */
export function getItemTimestamp(item) {
  if (!item) return null;
  if (item.captureDate) {
    const t = new Date(item.captureDate).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.lastModified) {
    const t = typeof item.lastModified === 'number' ? item.lastModified : new Date(item.lastModified).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.metadata?.lastModified) {
    const t = new Date(item.metadata.lastModified).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.originalFile?.lastModified) {
    return item.originalFile.lastModified;
  }
  if (item.fileBlob?.lastModified) {
    return item.fileBlob.lastModified;
  }
  return null;
}

/**
 * Checks if two filenames appear to be a sequential burst sequence.
 * Examples: "burst_01.jpg" & "burst_02.jpg", "IMG_1024.jpg" & "IMG_1025.jpg"
 * @param {string} name1
 * @param {string} name2
 * @returns {boolean}
 */
export function isSequentialFilename(name1, name2) {
  if (!name1 || !name2) return false;
  const re = /^(.*?)[_\-\s]?(\d+)(?:\.[^.]+)?$/i;
  const m1 = name1.match(re);
  const m2 = name2.match(re);
  if (!m1 || !m2) return false;

  const prefix1 = m1[1].toLowerCase();
  const prefix2 = m2[1].toLowerCase();
  if (prefix1 !== prefix2) return false;

  const num1 = parseInt(m1[2], 10);
  const num2 = parseInt(m2[2], 10);
  const diff = Math.abs(num1 - num2);
  return diff >= 1 && diff <= 3; // within 3 consecutive numbers
}

/**
 * Score an image's technical quality to be the canonical representative ("Best Version").
 * Prefers higher resolution, crisper edge sharpness, and modern uncompressed containers (HEIC/PNG).
 * @param {object} item
 * @returns {number}
 */
export function calculateRepresentativeScore(item) {
  const w = item.dimensions?.width || item.fingerprint?.width || 0;
  const h = item.dimensions?.height || item.fingerprint?.height || 0;
  const megapixels = (w * h) / 1000000;
  const sharpness = item.fingerprint?.sharpness || item.visualMetrics?.sharpnessScore || 50;
  const quality = item.visualMetrics?.qualityScore || 60;
  const fileSizeMb = (item.fileSize || 0) / (1024 * 1024);

  // Bonus for modern format representations
  const fmt = getNormalizedFormat(item);
  const formatBonus = fmt === 'HEIC' ? 6 : (fmt === 'PNG' ? 5 : (fmt === 'WEBP' ? 3 : 2));

  return (
    Math.min(30, megapixels * 4) +
    sharpness * 0.40 +
    quality * 0.25 +
    Math.min(10, fileSizeMb * 2) +
    formatBonus
  );
}

/**
 * Tier 1: Detect Exact Duplicates using SHA-256 Hashes
 * 100% byte-identical file copies.
 * @param {Array<object>} mediaList
 * @param {Array<object>} existingLibrary
 * @returns {Array<object>}
 */
export function detectExactDuplicates(mediaList, existingLibrary = []) {
  const hashMap = new Map();

  // Index existing library items first so existing items can serve as canonical originals
  existingLibrary.forEach((libItem) => {
    const hash = libItem.hash || libItem.fingerprint?.sha256;
    if (!hash) return;
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash).push({ ...libItem, isFromExistingLibrary: true });
  });

  // Add batch items
  mediaList.forEach((item) => {
    const hash = item.hash || item.fingerprint?.sha256;
    if (!hash) return;
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash).push(item);
  });

  const exactGroups = [];

  hashMap.forEach((items, hash) => {
    const hasBatchItem = items.some((i) => !i.isFromExistingLibrary);
    if (items.length > 1 && hasBatchItem) {
      const sorted = [...items].sort((a, b) => {
        if (a.isFromExistingLibrary && !b.isFromExistingLibrary) return -1;
        if (!a.isFromExistingLibrary && b.isFromExistingLibrary) return 1;
        return calculateRepresentativeScore(b) - calculateRepresentativeScore(a);
      });

      const canonical = sorted[0];
      const duplicates = sorted.slice(1);

      exactGroups.push({
        id: `exact-group-${hash.substring(0, 12)}`,
        type: 'exact',
        hash,
        canonical,
        duplicates,
        allFiles: items,
        reason: `Exact identical byte content detected across ${items.length} files (SHA-256 match).`,
      });
    }
  });

  return exactGroups;
}

/**
 * Tier 2: Detect Cross-Format Variants (e.g. JPG, PNG, WEBP, HEIC of the exact same image).
 * Groups identical visual images saved across different file formats / containers.
 * @param {Array<object>} mediaList
 * @param {Array<object>} existingLibrary
 * @param {Set<string>} excludedIds - IDs already assigned to exact duplicates
 * @returns {Array<object>}
 */
export function detectFormatVariants(mediaList, existingLibrary = [], excludedIds = new Set()) {
  const getPHash = (item) => item.fingerprint?.pHash || item.visualMetrics?.pHash;
  const getVec = (item) => item.fingerprint?.luminanceVec;

  const batchCandidates = mediaList.filter(
    (m) => !excludedIds.has(m.id) && getPHash(m) && getPHash(m) !== '0000000000000000' && m.mediaType !== 'video'
  );

  const libraryCandidates = existingLibrary.filter(
    (m) => !excludedIds.has(m.id) && getPHash(m) && getPHash(m) !== '0000000000000000' && m.mediaType !== 'video'
  );

  const allCandidates = [
    ...libraryCandidates.map((c) => ({ ...c, isFromExistingLibrary: true })),
    ...batchCandidates,
  ];

  const visited = new Set();
  const formatGroups = [];

  for (let i = 0; i < allCandidates.length; i++) {
    const itemA = allCandidates[i];
    if (visited.has(itemA.id)) continue;

    const hashA = getPHash(itemA);
    const vecA = getVec(itemA);
    const formatA = getNormalizedFormat(itemA);
    const group = [itemA];
    let maxSsim = 0;
    let minDistance = 64;

    for (let j = i + 1; j < allCandidates.length; j++) {
      const itemB = allCandidates[j];
      if (visited.has(itemB.id)) continue;

      const formatB = getNormalizedFormat(itemB);
      // Cross-format variant requires different container formats OR different encodings
      const isDifferentFormat = formatA !== formatB;
      if (!isDifferentFormat) continue;

      const hashB = getPHash(itemB);
      const vecB = getVec(itemB);
      const dist = calculateHammingDistance(hashA, hashB);

      // Verify perceptual match
      let isMatch = false;
      let ssim = 0;

      if (dist <= 4) {
        if (vecA && vecB) {
          ssim = computeBestSsimScore(vecA, vecB);
          if (ssim >= 0.88) {
            isMatch = true;
          }
        } else {
          isMatch = true;
        }
      } else if (dist <= 8 && vecA && vecB) {
        ssim = computeBestSsimScore(vecA, vecB);
        if (ssim >= 0.90) {
          isMatch = true;
        }
      }

      if (isMatch) {
        group.push(itemB);
        visited.add(itemB.id);
        if (dist < minDistance) minDistance = dist;
        if (ssim > maxSsim) maxSsim = ssim;
      }
    }

    const hasBatchItem = group.some((g) => !g.isFromExistingLibrary);

    if (group.length > 1 && hasBatchItem) {
      visited.add(itemA.id);

      // Sort by technical quality to select canonical representative ("Best Version")
      group.sort((a, b) => {
        if (a.isFromExistingLibrary && !b.isFromExistingLibrary) return -1;
        if (!a.isFromExistingLibrary && b.isFromExistingLibrary) return 1;
        return calculateRepresentativeScore(b) - calculateRepresentativeScore(a);
      });

      const canonical = group[0];
      const duplicates = group.slice(1);
      const formats = Array.from(new Set(group.map((f) => getNormalizedFormat(f))));

      formatGroups.push({
        id: `format-variant-${itemA.id}`,
        type: 'format_variant',
        formats,
        canonical,
        duplicates,
        allFiles: group,
        similarity: maxSsim > 0 ? Math.round(maxSsim * 100) : Math.round((1 - minDistance / 64) * 100),
        reason: `Same image detected across ${group.length} formats (${formats.join(', ')}).`,
      });
    }
  }

  return formatGroups;
}

/**
 * Tier 3: Detect Rapid Camera Burst Sequences
 * Identifies sequences of distinct photos captured within seconds of the same scene.
 * Distinguishes:
 * - CASE A (Actual Burst): 5 photos of the same group captured within seconds -> Burst Group.
 * - CASE B (Same Event, Different Moments): photos of different activities/framing -> Separate.
 * - CASE C (Similar Scene): photos of same location taken minutes apart -> Separate.
 * @param {Array<object>} mediaList
 * @param {Set<string>} excludedIds - IDs assigned to exact/format duplicates
 * @returns {Array<object>}
 */
export function detectBurstSequences(mediaList, excludedIds = new Set()) {
  const getPHash = (item) => item.fingerprint?.pHash || item.visualMetrics?.pHash;
  const getVec = (item) => item.fingerprint?.luminanceVec;

  // Filter available photos
  const photos = mediaList.filter((m) => !excludedIds.has(m.id) && m.mediaType !== 'video');

  // Sort chronologically using robust timestamp extractor
  photos.sort((a, b) => {
    const tA = getItemTimestamp(a) || 0;
    const tB = getItemTimestamp(b) || 0;
    if (tA && tB && tA !== tB) return tA - tB;
    // Secondary sort by filename
    return (a.originalFilename || '').localeCompare(b.originalFilename || '');
  });

  const burstGroups = [];
  let currentBurst = [];

  for (let i = 0; i < photos.length; i++) {
    const current = photos[i];

    if (currentBurst.length === 0) {
      currentBurst.push(current);
      continue;
    }

    const previous = currentBurst[currentBurst.length - 1];
    let isBurstMatch = false;

    // 1. Time difference
    const tCur = getItemTimestamp(current);
    const tPrev = getItemTimestamp(previous);
    const timeDeltaSec = (tCur && tPrev) ? (Math.abs(tCur - tPrev) / 1000) : null;

    // 2. Filename sequence check (e.g. burst_01.jpg, burst_02.jpg)
    const isSeq = isSequentialFilename(current.originalFilename, previous.originalFilename);

    // 3. Perceptual and Scene similarity
    let pHashDist = 64;
    const hashCur = getPHash(current);
    const hashPrev = getPHash(previous);
    if (hashCur && hashPrev && hashCur !== '0000000000000000') {
      pHashDist = calculateHammingDistance(hashCur, hashPrev);
    }

    const vecCur = getVec(current);
    const vecPrev = getVec(previous);
    let ssim = 0;
    if (vecCur && vecPrev) {
      ssim = computeSsimScore(vecCur, vecPrev);
    }

    // Camera consistency
    const sameCamera = (!current.cameraModel || !previous.cameraModel || current.cameraModel === previous.cameraModel);

    // BURST CLUSTER CRITERIA:
    // CASE A: Rapid shutter sequence (<= 4s, or <= 6s if sequential filenames) with scene similarity (pHash <= 16 OR SSIM >= 0.60)
    // CASE B: Different scene from same event (pHash > 20 and SSIM < 0.50) -> Rejected!
    // CASE C: Same scene taken minutes apart (> 15s) -> Rejected!
    const isRapidTime = timeDeltaSec !== null && timeDeltaSec <= (isSeq ? 6 : 4);
    const isSceneSimilar = pHashDist <= 16 || ssim >= 0.60;
    const hasBurstNameHint = /(burst|rapid|seq|shutter)/i.test(current.originalFilename || '') || /(burst|rapid|seq|shutter)/i.test(previous.originalFilename || '');

    if (isRapidTime && isSceneSimilar && sameCamera) {
      isBurstMatch = true;
    } else if (timeDeltaSec === null && isSeq && isSceneSimilar) {
      // Missing EXIF dates, but explicit sequential filenames with scene similarity
      isBurstMatch = true;
    } else if (hasBurstNameHint && isSeq && isSceneSimilar) {
      isBurstMatch = true;
    }

    if (isBurstMatch) {
      currentBurst.push(current);
    } else {
      if (currentBurst.length >= 2) {
        burstGroups.push(createBurstRecord(currentBurst));
      }
      currentBurst = [current];
    }
  }

  if (currentBurst.length >= 2) {
    burstGroups.push(createBurstRecord(currentBurst));
  }

  return burstGroups;
}

/**
 * Creates a rich Burst Sequence record with recommended top picks.
 * Recommends the strongest 1-3 photographs based on sharpness, exposure, resolution, and visual diversity.
 * @param {Array<object>} burstPhotos
 * @returns {object}
 */
function createBurstRecord(burstPhotos) {
  // Rank by technical quality
  const ranked = [...burstPhotos].sort((a, b) => calculateRepresentativeScore(b) - calculateRepresentativeScore(a));

  // Recommend 1 to 3 strongest photographs
  const maxPicks = Math.min(3, Math.max(1, Math.round(burstPhotos.length / 3)));
  const recommended = [ranked[0]]; // Primary sharpest pick

  // If selecting multiple, prefer visually distinct frames from the burst (e.g. different smile/pose)
  for (let i = 1; i < ranked.length && recommended.length < maxPicks; i++) {
    const candidate = ranked[i];
    const hashCand = candidate.fingerprint?.pHash;
    const tooSimilarToExistingPick = recommended.some((pick) => {
      const hashPick = pick.fingerprint?.pHash;
      if (!hashCand || !hashPick) return false;
      return calculateHammingDistance(hashCand, hashPick) <= 1; // nearly identical frame
    });

    if (!tooSimilarToExistingPick || recommended.length < maxPicks) {
      recommended.push(candidate);
    }
  }

  const recommendedIds = new Set(recommended.map((r) => r.id));
  const secondary = burstPhotos.filter((p) => !recommendedIds.has(p.id));

  const tFirst = getItemTimestamp(burstPhotos[0]);
  const tLast = getItemTimestamp(burstPhotos[burstPhotos.length - 1]);
  const timeSpanSec = (tFirst && tLast) ? parseFloat((Math.abs(tLast - tFirst) / 1000).toFixed(1)) : 0;

  return {
    id: `burst-group-${burstPhotos[0].id}`,
    type: 'burst',
    sequenceLabel: `Burst Sequence (${burstPhotos.length} Shots)`,
    totalCount: burstPhotos.length,
    timeSpanSeconds: timeSpanSec,
    allFiles: burstPhotos,
    recommended,
    secondary,
    reason: `Rapid camera sequence of ${burstPhotos.length} shots detected (${timeSpanSec > 0 ? `${timeSpanSec}s` : 'rapid sequence'}). Top ${recommended.length} sharpest frames recommended.`,
  };
}

/**
 * Tier 4: Detect Visual Near-Duplicates (Same format / edits / resized / compressed copies)
 * @param {Array<object>} mediaList
 * @param {Array<object>} existingLibrary
 * @param {Set<string>} excludedIds - IDs already assigned to exact, format, or burst duplicates
 * @returns {Array<object>}
 */
export function detectNearDuplicates(mediaList, existingLibrary = [], excludedIds = new Set()) {
  const getPHash = (item) => item.fingerprint?.pHash || item.visualMetrics?.pHash;
  const getVec = (item) => item.fingerprint?.luminanceVec;

  const batchCandidates = mediaList.filter(
    (m) => !excludedIds.has(m.id) && getPHash(m) && getPHash(m) !== '0000000000000000' && m.mediaType !== 'video'
  );

  const libraryCandidates = existingLibrary.filter(
    (m) => !excludedIds.has(m.id) && getPHash(m) && getPHash(m) !== '0000000000000000' && m.mediaType !== 'video'
  );

  const allCandidates = [
    ...libraryCandidates.map((c) => ({ ...c, isFromExistingLibrary: true })),
    ...batchCandidates,
  ];

  const visited = new Set();
  const nearGroups = [];

  for (let i = 0; i < allCandidates.length; i++) {
    const itemA = allCandidates[i];
    if (visited.has(itemA.id)) continue;

    const hashA = getPHash(itemA);
    const vecA = getVec(itemA);
    const group = [itemA];
    let minDistance = 64;
    let maxSsim = 0;

    for (let j = i + 1; j < allCandidates.length; j++) {
      const itemB = allCandidates[j];
      if (visited.has(itemB.id)) continue;

      const hashB = getPHash(itemB);
      const vecB = getVec(itemB);
      const dist = calculateHammingDistance(hashA, hashB);

      let isMatch = false;

      // Condition 1: High frequency DCT pHash match (Hamming distance <= 4)
      if (dist <= 4) {
        isMatch = true;
      } 
      // Condition 2: Borderline pHash (5-8 bits) -> Verified with SSIM
      else if (dist <= 8 && vecA && vecB) {
        const ssim = computeBestSsimScore(vecA, vecB);
        if (ssim >= 0.90) {
          isMatch = true;
          if (ssim > maxSsim) maxSsim = ssim;
        }
      }

      if (isMatch) {
        group.push(itemB);
        visited.add(itemB.id);
        if (dist < minDistance) minDistance = dist;
      }
    }

    const hasBatchItem = group.some((g) => !g.isFromExistingLibrary);

    if (group.length > 1 && hasBatchItem) {
      visited.add(itemA.id);

      group.sort((a, b) => {
        if (a.isFromExistingLibrary && !b.isFromExistingLibrary) return -1;
        if (!a.isFromExistingLibrary && b.isFromExistingLibrary) return 1;
        return calculateRepresentativeScore(b) - calculateRepresentativeScore(a);
      });

      const canonical = group[0];
      const duplicates = group.slice(1);

      nearGroups.push({
        id: `near-group-${itemA.id}`,
        type: 'near',
        minHammingDistance: minDistance,
        maxSsim: parseFloat(maxSsim.toFixed(3)),
        canonical,
        duplicates,
        allFiles: group,
        similarity: Math.round((1 - minDistance / 64) * 100),
        reason: `Visually identical photograph detected across ${group.length} files (Perceptual similarity: ${Math.round((1 - minDistance / 64) * 100)}%).`,
      });
    }
  }

  return nearGroups;
}

/**
 * Main Comprehensive Duplicate & Burst Pipeline
 * Runs all 4 detection tiers and builds a unified lookup map without duplicate counting.
 * @param {Array<object>} mediaList - Current batch
 * @param {Array<object>} existingLibrary - Existing stored vault media
 * @returns {object}
 */
export function analyzeDuplicatesAndBursts(mediaList, existingLibrary = []) {
  console.groupCollapsed(`[Dostflix Duplicate Engine] Analyzing ${mediaList.length} batch items against ${existingLibrary.length} vault items`);

  // 1. Exact duplicates (Byte match)
  const exactGroups = detectExactDuplicates(mediaList, existingLibrary);
  const exactDuplicateIds = new Set();
  exactGroups.forEach((g) => {
    g.duplicates.forEach((d) => {
      if (!d.isFromExistingLibrary) exactDuplicateIds.add(d.id);
    });
  });

  // 2. Cross-Format Variants (e.g. JPG, PNG, WEBP, HEIC of same image)
  const formatVariantGroups = detectFormatVariants(mediaList, existingLibrary, exactDuplicateIds);
  const formatVariantIds = new Set();
  const allFormatVariantIds = new Set();
  formatVariantGroups.forEach((g) => {
    g.allFiles.forEach((f) => allFormatVariantIds.add(f.id));
    g.duplicates.forEach((d) => {
      if (!d.isFromExistingLibrary) formatVariantIds.add(d.id);
    });
  });

  const excludedFromBursts = new Set([...exactDuplicateIds, ...allFormatVariantIds]);

  // 3. Burst Sequences (Distinct rapid-fire camera shots)
  const burstGroups = detectBurstSequences(mediaList, excludedFromBursts);
  const allBurstPhotoIds = new Set();
  const burstSecondaryIds = new Set();
  burstGroups.forEach((g) => {
    g.allFiles.forEach((f) => allBurstPhotoIds.add(f.id));
    g.secondary.forEach((s) => {
      burstSecondaryIds.add(s.id);
    });
  });

  const excludedFromNear = new Set([...exactDuplicateIds, ...allFormatVariantIds, ...allBurstPhotoIds]);

  // 4. Visual Near-Duplicates (Resized / heavily compressed versions in same format)
  const nearGroups = detectNearDuplicates(mediaList, existingLibrary, excludedFromNear);
  const nearDuplicateIds = new Set();
  nearGroups.forEach((g) => {
    g.duplicates.forEach((d) => {
      if (!d.isFromExistingLibrary) nearDuplicateIds.add(d.id);
    });
  });

  // 5. Build fast item lookup map for classification and UI
  const itemMap = new Map();

  // Exact Duplicates
  exactGroups.forEach((group) => {
    itemMap.set(group.canonical.id, {
      isExactDuplicate: false,
      isCanonical: true,
      duplicateCount: group.duplicates.length,
      groupId: group.id,
      duplicateType: 'exact',
      reason: 'Original primary copy (SHA-256 canonical)',
    });
    group.duplicates.forEach((dup) => {
      itemMap.set(dup.id, {
        isExactDuplicate: true,
        isCanonical: false,
        canonicalId: group.canonical.id,
        groupId: group.id,
        duplicateType: 'exact',
        reason: `Exact identical copy of ${group.canonical.originalFilename}`,
      });
    });
  });

  // Cross-Format Variants
  formatVariantGroups.forEach((group) => {
    if (!itemMap.has(group.canonical.id)) {
      itemMap.set(group.canonical.id, {
        isFormatVariant: false,
        isCanonical: true,
        duplicateCount: group.duplicates.length,
        groupId: group.id,
        duplicateType: 'format_variant',
        formats: group.formats,
        reason: `Recommended best version for cross-format group (${group.formats.join(', ')})`,
      });
    }
    group.duplicates.forEach((dup) => {
      itemMap.set(dup.id, {
        isFormatVariant: true,
        isCanonical: false,
        canonicalId: group.canonical.id,
        groupId: group.id,
        duplicateType: 'format_variant',
        formats: group.formats,
        reason: `Format variant of ${group.canonical.originalFilename} (${getNormalizedFormat(dup)})`,
      });
    });
  });

  // Burst Sequences
  burstGroups.forEach((group) => {
    group.recommended.forEach((item) => {
      const existing = itemMap.get(item.id) || {};
      itemMap.set(item.id, {
        ...existing,
        isBurst: true,
        isBurstRecommended: true,
        burstGroupId: group.id,
        burstTotal: group.totalCount,
        reason: 'Recommended top frame from burst sequence',
      });
    });
    group.secondary.forEach((item) => {
      const existing = itemMap.get(item.id) || {};
      itemMap.set(item.id, {
        ...existing,
        isBurst: true,
        isBurstRecommended: false,
        burstGroupId: group.id,
        burstTotal: group.totalCount,
        reason: 'Secondary frame in burst sequence',
      });
    });
  });

  // Near Duplicates
  nearGroups.forEach((group) => {
    if (!itemMap.has(group.canonical.id)) {
      itemMap.set(group.canonical.id, {
        isNearDuplicate: false,
        isCanonical: true,
        duplicateCount: group.duplicates.length,
        groupId: group.id,
        duplicateType: 'near',
        reason: 'Recommended sharpest representative for near-duplicate set',
      });
    }
    group.duplicates.forEach((dup) => {
      itemMap.set(dup.id, {
        isNearDuplicate: true,
        isCanonical: false,
        canonicalId: group.canonical.id,
        groupId: group.id,
        duplicateType: 'near',
        reason: `Visually identical to ${group.canonical.originalFilename} (compressed/resized)`,
      });
    });
  });

  console.log('Exact duplicate groups:', exactGroups.length, 'Copies:', exactDuplicateIds.size);
  console.log('Cross-format variant groups:', formatVariantGroups.length, 'Copies:', formatVariantIds.size);
  console.log('Burst sequences:', burstGroups.length, 'Secondary frames:', burstSecondaryIds.size);
  console.log('Near duplicate groups:', nearGroups.length, 'Copies:', nearDuplicateIds.size);
  console.groupEnd();

  return {
    exactGroups,
    formatVariantGroups,
    nearGroups,
    burstGroups,
    itemMap,
    totalExactDuplicates: exactDuplicateIds.size,
    totalFormatVariants: formatVariantIds.size,
    totalNearDuplicates: nearDuplicateIds.size,
    totalBurstSequences: burstGroups.length,
  };
}