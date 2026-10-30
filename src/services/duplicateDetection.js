// Advanced Duplicate & Burst Detection Service for Dostflix Memory Studio
// Implements 3 levels of detection:
// Level 1: Exact Duplicates via SHA-256 hashing.
// Level 2: Near-Duplicates via 64-bit Perceptual Hashing (dHash) & Hamming Distance.
// Level 3: High-Speed Burst Sequences via Chronological & Perceptual Clustering.

import { calculateHammingDistance } from './visualAnalysisEngine.js';

/**
 * Score an image's technical suitability to be the canonical representative.
 * Higher score = sharper, higher resolution, better exposed.
 * @param {object} item
 * @returns {number}
 */
export function calculateRepresentativeScore(item) {
  const quality = item.visualMetrics?.qualityScore || item.visual_quality || 50;
  const sharpness = item.visualMetrics?.sharpnessScore || 50;
  const exposure = item.visualMetrics?.exposureScore || 50;
  const megapixels = item.visualMetrics?.megapixels || 2;
  const resolutionBonus = Math.min(25, megapixels * 3);

  return sharpness * 0.45 + exposure * 0.30 + quality * 0.25 + resolutionBonus;
}

/**
 * Level 1: Detect Exact Duplicates using SHA-256 Hashes
 * @param {Array<object>} mediaList
 * @returns {Array<object>} Exact duplicate groups
 */
export function detectExactDuplicates(mediaList) {
  const hashMap = new Map();

  mediaList.forEach((item) => {
    if (!item.hash) return;
    if (!hashMap.has(item.hash)) {
      hashMap.set(item.hash, []);
    }
    hashMap.get(item.hash).push(item);
  });

  const exactGroups = [];

  hashMap.forEach((items, hash) => {
    if (items.length > 1) {
      // Pick representative: prefer original file with highest resolution or earliest capture
      const sorted = [...items].sort((a, b) => {
        const scoreA = calculateRepresentativeScore(a);
        const scoreB = calculateRepresentativeScore(b);
        return scoreB - scoreA;
      });

      const canonical = sorted[0];
      const duplicates = sorted.slice(1);

      exactGroups.push({
        id: `exact-group-${hash.substring(0, 10)}`,
        type: 'exact_duplicate',
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
 * Level 2: Detect Near-Duplicates using Perceptual Hash Hamming Distance
 * Identifies resized, recompressed, or minor color-graded versions.
 * @param {Array<object>} mediaList
 * @param {Set<string>} excludedIds - IDs already assigned to exact duplicates
 * @returns {Array<object>} Near duplicate groups
 */
export function detectNearDuplicates(mediaList, excludedIds = new Set()) {
  const candidates = mediaList.filter((m) => !excludedIds.has(m.id) && m.visualMetrics?.pHash && m.mediaType !== 'video');
  const visited = new Set();
  const nearGroups = [];

  for (let i = 0; i < candidates.length; i++) {
    const itemA = candidates[i];
    if (visited.has(itemA.id)) continue;

    const group = [itemA];
    let minDistance = 64;

    for (let j = i + 1; j < candidates.length; j++) {
      const itemB = candidates[j];
      if (visited.has(itemB.id)) continue;

      const dist = calculateHammingDistance(itemA.visualMetrics.pHash, itemB.visualMetrics.pHash);

      // Distance <= 6 is a very strong near-duplicate (e.g. resized / compressed / re-saved)
      // Distance <= 9 is a near-duplicate if aspect ratio is identical and capture dates match within 2 minutes
      let isNearDuplicate = dist <= 6;
      if (!isNearDuplicate && dist <= 9) {
        const aspectDiff = Math.abs((itemA.visualMetrics?.aspectRatio || 1) - (itemB.visualMetrics?.aspectRatio || 1));
        const dateA = itemA.captureDate ? new Date(itemA.captureDate).getTime() : 0;
        const dateB = itemB.captureDate ? new Date(itemB.captureDate).getTime() : 0;
        const timeDiffSec = Math.abs(dateA - dateB) / 1000;
        if (aspectDiff < 0.05 || (dateA && dateB && timeDiffSec <= 120)) {
          isNearDuplicate = true;
        }
      }

      if (isNearDuplicate) {
        group.push(itemB);
        visited.add(itemB.id);
        if (dist < minDistance) minDistance = dist;
      }
    }

    if (group.length > 1) {
      visited.add(itemA.id);

      // Sort by technical quality score to recommend the sharpest, clearest photo
      group.sort((a, b) => calculateRepresentativeScore(b) - calculateRepresentativeScore(a));

      const canonical = group[0];
      const duplicates = group.slice(1);

      nearGroups.push({
        id: `near-group-${itemA.id}`,
        type: 'near_duplicate',
        minHammingDistance: minDistance,
        canonical,
        duplicates,
        allFiles: group,
        reason: `Visually identical composition detected across ${group.length} files (Hamming distance ${minDistance}/64).`,
      });
    }
  }

  return nearGroups;
}

/**
 * Level 3: Detect Burst Photo Sequences
 * Identifies rapid-fire camera bursts captured within short seconds of each other.
 * Recommends the top 1-3 sharpest/best-composed photos while grouping the rest.
 * @param {Array<object>} mediaList
 * @param {Set<string>} excludedIds
 * @returns {Array<object>} Burst photo groups
 */
export function detectBurstSequences(mediaList, excludedIds = new Set()) {
  const photos = mediaList
    .filter((m) => !excludedIds.has(m.id) && m.mediaType !== 'video')
    .sort((a, b) => {
      const tA = a.captureDate ? new Date(a.captureDate).getTime() : 0;
      const tB = b.captureDate ? new Date(b.captureDate).getTime() : 0;
      return tA - tB;
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
    let isBurstCandidate = false;

    // Signal A: Captured within 6 seconds of previous photo
    const tCur = current.captureDate ? new Date(current.captureDate).getTime() : 0;
    const tPrev = previous.captureDate ? new Date(previous.captureDate).getTime() : 0;
    const timeDeltaSec = (tCur && tPrev) ? (Math.abs(tCur - tPrev) / 1000) : 999;

    // Signal B: Visual similarity (Hamming distance <= 14)
    let pHashDist = 64;
    if (current.visualMetrics?.pHash && previous.visualMetrics?.pHash) {
      pHashDist = calculateHammingDistance(current.visualMetrics.pHash, previous.visualMetrics.pHash);
    }

    // Signal C: Sequential filename pattern (e.g. IMG_3041, IMG_3042)
    const isSeq = Boolean(
      current.originalFilename &&
      previous.originalFilename &&
      current.originalFilename.replace(/\d+/g, '') === previous.originalFilename.replace(/\d+/g, '')
    );

    if ((timeDeltaSec <= 6 && pHashDist <= 16) || (timeDeltaSec <= 10 && isSeq && pHashDist <= 20)) {
      isBurstCandidate = true;
    }

    if (isBurstCandidate) {
      currentBurst.push(current);
    } else {
      if (currentBurst.length >= 3) {
        burstGroups.push(createBurstRecord(currentBurst));
      }
      currentBurst = [current];
    }
  }

  if (currentBurst.length >= 3) {
    burstGroups.push(createBurstRecord(currentBurst));
  }

  return burstGroups;
}

/**
 * Creates a structured Burst record with recommended top picks.
 * @param {Array<object>} burstPhotos
 * @returns {object}
 */
function createBurstRecord(burstPhotos) {
  // Rank all photos in the burst by technical quality and sharpness
  const ranked = [...burstPhotos].sort((a, b) => calculateRepresentativeScore(b) - calculateRepresentativeScore(a));

  // Recommend the top 1 to 3 non-identical photos
  const recommended = [ranked[0]];
  const maxPicks = Math.min(3, Math.max(1, Math.round(burstPhotos.length / 4)));

  for (let i = 1; i < ranked.length; i++) {
    if (recommended.length >= maxPicks) break;
    const candidate = ranked[i];
    // Check if candidate is sufficiently visually distinct from already recommended picks
    const isDistinct = recommended.every((rec) => {
      const dist = calculateHammingDistance(rec.visualMetrics?.pHash, candidate.visualMetrics?.pHash);
      return dist >= 4; // At least 4 bits difference
    });
    if (isDistinct) {
      recommended.push(candidate);
    }
  }

  const recommendedIds = new Set(recommended.map((r) => r.id));
  const secondary = burstPhotos.filter((p) => !recommendedIds.has(p.id));

  const tFirst = burstPhotos[0].captureDate ? new Date(burstPhotos[0].captureDate).getTime() : 0;
  const tLast = burstPhotos[burstPhotos.length - 1].captureDate ? new Date(burstPhotos[burstPhotos.length - 1].captureDate).getTime() : 0;
  const timeSpanSec = (tFirst && tLast) ? Math.round(Math.abs(tLast - tFirst) / 1000) : 0;

  return {
    id: `burst-group-${Date.now()}-${burstPhotos[0].id}`,
    type: 'burst_sequence',
    totalCount: burstPhotos.length,
    timeSpanSeconds: timeSpanSec,
    allFiles: burstPhotos,
    recommended,
    secondary,
    reason: `Burst sequence of ${burstPhotos.length} consecutive shots detected (${timeSpanSec}s). Top ${recommended.length} sharpest frames recommended.`,
  };
}

/**
 * Comprehensive Duplicate & Burst Pipeline
 * Runs Level 1 (Exact), Level 2 (Near-Duplicates), and Level 3 (Bursts).
 * Generates an indexed lookup map for fast UI tagging.
 * @param {Array<object>} mediaList
 * @returns {object}
 */
export function analyzeDuplicatesAndBursts(mediaList) {
  // 1. Exact duplicates
  const exactGroups = detectExactDuplicates(mediaList);
  const exactDuplicateIds = new Set();
  exactGroups.forEach((g) => g.duplicates.forEach((d) => exactDuplicateIds.add(d.id)));

  // 2. Near duplicates (exclude files already marked as exact duplicate copies)
  const nearGroups = detectNearDuplicates(mediaList, exactDuplicateIds);
  const nearDuplicateIds = new Set();
  nearGroups.forEach((g) => g.duplicates.forEach((d) => nearDuplicateIds.add(d.id)));

  // Combined duplicate copies set
  const allDuplicateCopies = new Set([...exactDuplicateIds, ...nearDuplicateIds]);

  // 3. Burst sequences (run on active non-duplicate files)
  const burstGroups = detectBurstSequences(mediaList, allDuplicateCopies);

  // 4. Build fast lookup map
  const itemMap = new Map();

  // Mark exact duplicates
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

  // Mark near duplicates
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

  // Mark burst sequence items
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
        reason: 'Secondary frame in burst sequence (can be reviewed)',
      });
    });
  });

  return {
    exactGroups,
    nearGroups,
    burstGroups,
    itemMap,
    totalExactDuplicates: exactDuplicateIds.size,
    totalNearDuplicates: nearDuplicateIds.size,
    totalBurstSequences: burstGroups.length,
  };
}
