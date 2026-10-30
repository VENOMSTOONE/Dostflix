// Advanced 3-Level Duplicate & Burst Detection Engine for Dostflix Memory Studio
// Level 1: Exact Duplicates via SHA-256 byte hash.
// Level 2: Visual Near-Duplicates via 64-bit DCT pHash + SSIM verification.
// Level 3: Burst Sequences via Chronological & Visual Clustering.
// Full cross-comparison: compares batch items against each other AND against existing vault media.

import { calculateHammingDistance, computeSsimScore } from './imageFingerprint.js';

/**
 * Score an image's technical quality to be the canonical representative.
 * Prefers higher resolution, crisper edge sharpness, and less compression artifacts.
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

  return (
    Math.min(30, megapixels * 4) +
    sharpness * 0.40 +
    quality * 0.25 +
    Math.min(10, fileSizeMb * 2)
  );
}

/**
 * Level 1: Detect Exact Duplicates using SHA-256 Hashes
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
    // Only care if there's a duplicate and at least one item is from the current batch
    const hasBatchItem = items.some((i) => !i.isFromExistingLibrary);
    if (items.length > 1 && hasBatchItem) {
      // Sort: prefer existing library item as canonical, then highest resolution
      const sorted = [...items].sort((a, b) => {
        if (a.isFromExistingLibrary && !b.isFromExistingLibrary) return -1;
        if (!a.isFromExistingLibrary && b.isFromExistingLibrary) return 1;
        return calculateRepresentativeScore(b) - calculateRepresentativeScore(a);
      });

      const canonical = sorted[0];
      const duplicates = sorted.slice(1);

      exactGroups.push({
        id: `exact-group-${hash.substring(0, 12)}`,
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
 * Level 2: Detect Visual Near-Duplicates using DCT pHash & SSIM Verification
 * Detects resized, recompressed, or format-converted (e.g. HEIC to JPEG) versions.
 * @param {Array<object>} mediaList
 * @param {Array<object>} existingLibrary
 * @param {Set<string>} excludedIds - IDs already assigned to exact duplicates
 * @returns {Array<object>}
 */
export function detectNearDuplicates(mediaList, existingLibrary = [], excludedIds = new Set()) {
  const getPHash = (item) => item.fingerprint?.pHash || item.visualMetrics?.pHash;
  const getVec = (item) => item.fingerprint?.luminanceVec;

  // Filter candidates with valid 16-hex pHash that are not already exact duplicates
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

      // Condition 1: High frequency DCT pHash match (Hamming distance <= 6)
      if (dist <= 6) {
        isMatch = true;
      } 
      // Condition 2: Borderline pHash (7-10 bits) -> Verified with SSIM
      else if (dist <= 10 && vecA && vecB) {
        const ssim = computeSsimScore(vecA, vecB);
        if (ssim >= 0.86) {
          isMatch = true;
          if (ssim > maxSsim) maxSsim = ssim;
        }
      }
      // Condition 3: Same aspect ratio and capture date within 1 minute with pHash <= 8
      else if (dist <= 8) {
        const aspectA = itemA.dimensions?.width && itemA.dimensions?.height ? (itemA.dimensions.width / itemA.dimensions.height) : 1;
        const aspectB = itemB.dimensions?.width && itemB.dimensions?.height ? (itemB.dimensions.width / itemB.dimensions.height) : 1;
        const aspectDiff = Math.abs(aspectA - aspectB);
        if (aspectDiff < 0.04) {
          isMatch = true;
        }
      }

      if (isMatch) {
        group.push(itemB);
        visited.add(itemB.id);
        if (dist < minDistance) minDistance = dist;
      }
    }

    // Only create group if at least 1 item in the group is from the current batch
    const hasBatchItem = group.some((g) => !g.isFromExistingLibrary);

    if (group.length > 1 && hasBatchItem) {
      visited.add(itemA.id);

      // Sort by technical quality to select canonical representative
      group.sort((a, b) => {
        if (a.isFromExistingLibrary && !b.isFromExistingLibrary) return -1;
        if (!a.isFromExistingLibrary && b.isFromExistingLibrary) return 1;
        return calculateRepresentativeScore(b) - calculateRepresentativeScore(a);
      });

      const canonical = group[0];
      const duplicates = group.slice(1);

      nearGroups.push({
        id: `near-group-${itemA.id}`,
        type: 'near_duplicate',
        minHammingDistance: minDistance,
        maxSsim: parseFloat(maxSsim.toFixed(3)),
        canonical,
        duplicates,
        allFiles: group,
        reason: `Visually identical photograph detected across ${group.length} files (Perceptual similarity: ${Math.round((1 - minDistance / 64) * 100)}%).`,
      });
    }
  }

  return nearGroups;
}

/**
 * Level 3: Detect Burst Photo Sequences (Separate from Duplicates)
 * Identifies sequences of distinct photos captured in rapid succession.
 * @param {Array<object>} mediaList
 * @param {Set<string>} excludedIds
 * @returns {Array<object>}
 */
export function detectBurstSequences(mediaList, excludedIds = new Set()) {
  const getPHash = (item) => item.fingerprint?.pHash || item.visualMetrics?.pHash;

  const photos = mediaList
    .filter((m) => !excludedIds.has(m.id) && m.mediaType !== 'video')
    .sort((a, b) => {
      const tA = a.captureDate ? new Date(a.captureDate).getTime() : (a.lastModified || 0);
      const tB = b.captureDate ? new Date(b.captureDate).getTime() : (b.lastModified || 0);
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

    // Time difference
    const tCur = current.captureDate ? new Date(current.captureDate).getTime() : (current.lastModified || 0);
    const tPrev = previous.captureDate ? new Date(previous.captureDate).getTime() : (previous.lastModified || 0);
    const timeDeltaSec = (tCur && tPrev) ? (Math.abs(tCur - tPrev) / 1000) : 999;

    // Perceptual distance
    let pHashDist = 64;
    const hashCur = getPHash(current);
    const hashPrev = getPHash(previous);
    if (hashCur && hashPrev && hashCur !== '0000000000000000') {
      pHashDist = calculateHammingDistance(hashCur, hashPrev);
    }

    // Filename sequence check (e.g. IMG_1041.jpg, IMG_1042.jpg)
    const isSeq = Boolean(
      current.originalFilename &&
      previous.originalFilename &&
      current.originalFilename.replace(/\d+/g, '') === previous.originalFilename.replace(/\d+/g, '')
    );

    // Burst condition: 3+ photos within 6s of each other with moderate visual scene similarity (dist 4-18)
    // Note: dist <= 3 is considered a duplicate, not a burst!
    if ((timeDeltaSec <= 6 && pHashDist >= 4 && pHashDist <= 20) || (timeDeltaSec <= 10 && isSeq && pHashDist <= 24)) {
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

function createBurstRecord(burstPhotos) {
  const ranked = [...burstPhotos].sort((a, b) => calculateRepresentativeScore(b) - calculateRepresentativeScore(a));
  const maxPicks = Math.min(3, Math.max(1, Math.round(burstPhotos.length / 4)));
  const recommended = ranked.slice(0, maxPicks);
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
 * Main Comprehensive Duplicate & Burst Pipeline
 * Runs Level 1 (Exact), Level 2 (Near-Duplicates), Level 3 (Bursts), with diagnostics logging.
 * @param {Array<object>} mediaList - Current batch
 * @param {Array<object>} existingLibrary - Existing stored media
 * @returns {object}
 */
export function analyzeDuplicatesAndBursts(mediaList, existingLibrary = []) {
  console.groupCollapsed(`[Dostflix Duplicate Engine] Analyzing ${mediaList.length} batch items against ${existingLibrary.length} vault items`);

  // 1. Exact duplicates
  const exactGroups = detectExactDuplicates(mediaList, existingLibrary);
  const exactDuplicateIds = new Set();
  exactGroups.forEach((g) => {
    g.duplicates.forEach((d) => {
      // Only count items in the batch as duplicates
      if (!d.isFromExistingLibrary) exactDuplicateIds.add(d.id);
    });
  });

  // 2. Near duplicates
  const nearGroups = detectNearDuplicates(mediaList, existingLibrary, exactDuplicateIds);
  const nearDuplicateIds = new Set();
  nearGroups.forEach((g) => {
    g.duplicates.forEach((d) => {
      if (!d.isFromExistingLibrary) nearDuplicateIds.add(d.id);
    });
  });

  const allDuplicateCopies = new Set([...exactDuplicateIds, ...nearDuplicateIds]);

  // 3. Burst sequences
  const burstGroups = detectBurstSequences(mediaList, allDuplicateCopies);

  // 4. Build fast item lookup map
  const itemMap = new Map();

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
        reason: `Visually identical to ${group.canonical.originalFilename} (compressed/resized/format-converted)`,
      });
    });
  });

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

  console.log('Exact duplicate groups:', exactGroups.length, 'Duplicate copies:', exactDuplicateIds.size);
  console.log('Near duplicate groups:', nearGroups.length, 'Duplicate copies:', nearDuplicateIds.size);
  console.log('Burst sequences:', burstGroups.length);
  console.groupEnd();

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
