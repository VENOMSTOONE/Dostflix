// Intelligent Memory Organization & Curation Engine for Dostflix Memory Studio
// Ground-truth clustering based on verified metadata, perceptual visual similarity,
// technical quality assessment, duplicate/burst reduction, and transparent curation tiers.
// NO fabricated dates, NO fake squad titles, NO facial recognition.

import { calculateHammingDistance, analyzeImageQualityAndContent } from './visualAnalysisEngine.js';
import { analyzeDuplicatesAndBursts } from './duplicateDetection.js';
import { classifyMediaItem, selectBestCoverCandidates } from './contentClassifier.js';
import { analyzeMediaContent } from './visionAiService.js';

/**
 * Haversine distance in kilometers between two GPS coordinates
 */
export function calculateGpsDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if two timestamps are within a given time window (in hours)
 */
export function isWithinHours(dateStr1, dateStr2, maxHours = 6) {
  if (!dateStr1 || !dateStr2) return false;
  const t1 = new Date(dateStr1).getTime();
  const t2 = new Date(dateStr2).getTime();
  if (isNaN(t1) || isNaN(t2)) return false;
  const diffHours = Math.abs(t1 - t2) / (1000 * 60 * 60);
  return diffHours <= maxHours;
}

/**
 * Check if two filenames appear to be part of a sequential camera burst or batch
 */
export function isSequentialFilename(name1, name2) {
  if (!name1 || !name2) return false;
  const re = /^(.*?)(\d+)(?:\.[^.]+)?$/i;
  const m1 = name1.match(re);
  const m2 = name2.match(re);
  if (!m1 || !m2) return false;
  if (m1[1].toLowerCase() !== m2[1].toLowerCase()) return false;
  const diff = Math.abs(parseInt(m1[2], 10) - parseInt(m2[2], 10));
  return diff >= 1 && diff <= 5; // within 5 consecutive frames
}

/**
 * Helper to check if a folder name is meaningful (not generic system folders)
 */
export function isMeaningfulFolder(folderName) {
  if (!folderName) return false;
  const generic = ['media', 'dcim', 'images', 'photos', 'camera', 'downloads', 'pictures', 'videos', '100apple', '100media'];
  return !generic.includes(folderName.trim().toLowerCase());
}

/**
 * Generate an authentic title from real metadata (Folder > AI Scene > Verified Date > Neutral Fallback)
 * Never fabricates fake squad events or fantasy dates.
 */
export function suggestMemoryTitle(files, sceneContext = null) {
  if (!files || files.length === 0) return 'Suggested Memory';

  // 1. Check for shared meaningful folder name
  const folderNames = files.map(f => f.folderName).filter(isMeaningfulFolder);
  if (folderNames.length > 0) {
    const counts = {};
    folderNames.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    const topFolder = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (topFolder) {
      return topFolder
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  // 2. Check for common scene context if provided by vision analysis
  if (sceneContext && sceneContext.length > 2) {
    return sceneContext.replace(/\b\w/g, l => l.toUpperCase());
  }

  // 3. Derive from verified or genuine capture date
  const validDates = files
    .map(f => f.captureDate)
    .filter(Boolean)
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (validDates.length > 0) {
    const earliest = validDates[0];
    const formattedDate = earliest.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `Suggested Memory — ${formattedDate}`;
  }

  // 4. Fallback: Neutral label (no fake dates or made-up event names)
  return 'Suggested Memory';
}

/**
 * Ensures an image has visualMetrics (pHash, sharpness, exposure).
 * Computes them dynamically if missing from prior uploads.
 */
async function ensureVisualMetrics(item) {
  if (item.visualMetrics && item.visualMetrics.pHash) {
    return item.visualMetrics;
  }

  if (typeof window === 'undefined') {
    return {
      pHash: '0000000000000000',
      qualityScore: 60,
      sharpnessScore: 60,
      exposureScore: 60,
      isBlurry: false,
      isBlank: false,
    };
  }

  try {
    const imgUrl = item.thumbnail || item.previewUrl;
    if (!imgUrl) throw new Error('No preview URL available for visual analysis');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = imgUrl;
    });

    const metrics = await analyzeImageQualityAndContent(img, item.dimensions?.width, item.dimensions?.height);
    item.visualMetrics = metrics;
    return metrics;
  } catch (err) {
    return {
      pHash: '0000000000000000',
      qualityScore: 50,
      sharpnessScore: 50,
      exposureScore: 50,
      isBlurry: false,
      isBlank: false,
    };
  }
}

/**
 * Comprehensive Intelligent Memory Organization & Curation Engine
 * Integrates metadata, visual content analysis, duplicate detection, burst detection,
 * quality scoring, and image recommendation.
 */
export async function analyzeAndOrganizeBatch(uploadedMediaList, existingMemories = [], onProgress) {
  const matchExisting = [];
  const suggestedNew = [];
  const unorganized = [];

  // Filter unassigned files
  const unassignedFiles = uploadedMediaList.filter(f => !f.assignedMemoryId);
  const totalFiles = unassignedFiles.length;

  if (totalFiles === 0) {
    return {
      matchExisting: [],
      suggestedNew: [],
      archiveGroup: { title: 'Archive & Documents', files: [] },
      duplicateGroup: { exact: [], near: [], totalCount: 0 },
      burstGroup: { bursts: [], totalCount: 0 },
      unorganized: [],
      overview: {
        totalAnalyzed: 0,
        recommendedCount: 0,
        reviewCount: 0,
        archiveCount: 0,
        exactDuplicateCount: 0,
        nearDuplicateCount: 0,
        burstCount: 0,
        excludedCount: 0,
        unorganizedCount: 0,
        suggestedMemoriesCount: 0,
        existingMatchesCount: 0,
      },
    };
  }

  // =========================================================================
  // STAGE 1: VISUAL METRICS & COMPUTER VISION ANALYSIS
  // =========================================================================
  onProgress?.({ stage: 'Visual analysis & perceptual hashing', percent: 20 });
  for (let i = 0; i < unassignedFiles.length; i++) {
    const item = unassignedFiles[i];
    const metrics = await ensureVisualMetrics(item);
    if (!item.visionAnalysis) {
      item.visionAnalysis = await analyzeMediaContent(item, metrics);
    }
  }

  // =========================================================================
  // STAGE 2: DUPLICATE & BURST DETECTION
  // =========================================================================
  onProgress?.({ stage: 'Detecting duplicates and burst sequences', percent: 45 });
  const duplicateResults = analyzeDuplicatesAndBursts(unassignedFiles);
  const { exactGroups, nearGroups, burstGroups, itemMap } = duplicateResults;

  // =========================================================================
  // STAGE 3: CONTENT CLASSIFICATION & QUALITY TIERING
  // =========================================================================
  onProgress?.({ stage: 'Classifying content & technical quality', percent: 65 });
  const archiveFiles = [];
  const eligibleFiles = []; // Files eligible for memory recommendation (KEEP & REVIEW)

  unassignedFiles.forEach((file) => {
    const dupInfo = itemMap.get(file.id);
    const classification = classifyMediaItem(file, dupInfo);
    file.classification = classification;

    if (classification.category === 'ARCHIVE') {
      archiveFiles.push(file);
    } else {
      eligibleFiles.push(file);
    }
  });

  const remainingFiles = [...eligibleFiles];

  // =========================================================================
  // STAGE 4: MATCH AGAINST EXISTING MEMORIES
  // =========================================================================
  onProgress?.({ stage: 'Matching against existing memories', percent: 75 });
  existingMemories.forEach((memory) => {
    const memoryDate = memory.date ? new Date(memory.date) : null;
    const memoryTitleLower = (memory.title || '').trim().toLowerCase();
    const memoryLocationLower = (memory.location || '').trim().toLowerCase();
    const matchedFiles = [];
    const matchReasons = new Set();
    let totalScore = 0;

    remainingFiles.forEach((file) => {
      // Don't match duplicate copies or excluded files to existing memories
      if (file.classification?.category === 'EXCLUDE') return;

      let fileScore = 0;
      const fileReasons = [];

      // Signal A: Matching date within 48 hours
      if (file.captureDate && memoryDate && !isNaN(memoryDate.getTime())) {
        const fileDate = new Date(file.captureDate);
        if (!isNaN(fileDate.getTime())) {
          const dayDiff = Math.abs(fileDate.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24);
          if (dayDiff <= 1.0) {
            fileScore += 50;
            fileReasons.push(file.isVerifiedMetadata ? 'Verified EXIF date matches memory date (within 24h)' : 'Inferred date matches memory date');
          } else if (dayDiff <= 2.5) {
            fileScore += 30;
            fileReasons.push('Close date proximity to memory');
          }
        }
      }

      // Signal B: Shared location keyword in filename or folder
      const filenameLower = (file.originalFilename || '').toLowerCase();
      const folderLower = (file.folderName || '').toLowerCase();
      if (memoryLocationLower && memoryLocationLower.length > 2) {
        if (filenameLower.includes(memoryLocationLower) || folderLower.includes(memoryLocationLower)) {
          fileScore += 40;
          fileReasons.push(`Location matched: "${memory.location}"`);
        }
      }

      // Signal C: Folder name contains memory title
      if (folderLower && isMeaningfulFolder(folderLower) && memoryTitleLower.includes(folderLower)) {
        fileScore += 40;
        fileReasons.push(`Folder name matches memory: "${file.folderName}"`);
      }

      // Signal D: Verified GPS proximity (within 5 km)
      if (file.gps && (memory.coordinates || memory.gps)) {
        const targetGps = memory.coordinates || memory.gps;
        const dist = calculateGpsDistanceKm(
          file.gps.latitude,
          file.gps.longitude,
          targetGps.latitude || targetGps.lat,
          targetGps.longitude || targetGps.lng
        );
        if (dist != null && dist <= 5.0) {
          fileScore += 50;
          fileReasons.push(`Within ${dist.toFixed(1)} km of memory GPS location`);
        }
      }

      // Threshold to consider matched
      if (fileScore >= 40) {
        matchedFiles.push({ file, score: fileScore });
        fileReasons.forEach(r => matchReasons.add(r));
        totalScore += fileScore;
      }
    });

    if (matchedFiles.length > 0) {
      const avgScore = totalScore / matchedFiles.length;
      const confidenceLevel = avgScore >= 70 ? 'high' : (avgScore >= 45 ? 'medium' : 'low');
      const confidence = confidenceLevel === 'high' 
        ? 'HIGH CONFIDENCE' 
        : (confidenceLevel === 'medium' ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE');

      matchExisting.push({
        id: `match-${memory.id}-${Date.now()}`,
        type: 'match_existing',
        targetMemory: memory,
        files: matchedFiles.map(m => m.file),
        reasons: Array.from(matchReasons),
        confidence,
        confidenceLevel,
      });

      const matchedIds = new Set(matchedFiles.map(m => m.file.id));
      for (let i = remainingFiles.length - 1; i >= 0; i--) {
        if (matchedIds.has(remainingFiles[i].id)) {
          remainingFiles.splice(i, 1);
        }
      }
    }
  });

  // =========================================================================
  // STAGE 5: CLUSTER REMAINING FILES INTO NEW MEMORIES
  // =========================================================================
  onProgress?.({ stage: 'Intelligent memory clustering & cover selection', percent: 85 });
  
  // Sort remaining chronologically
  remainingFiles.sort((a, b) => {
    const tA = a.captureDate ? new Date(a.captureDate).getTime() : 0;
    const tB = b.captureDate ? new Date(b.captureDate).getTime() : 0;
    return tA - tB;
  });

  const clusters = [];
  let currentCluster = [];

  remainingFiles.forEach((file) => {
    // If file is an excluded duplicate, keep it separate from primary clusters
    if (file.classification?.category === 'EXCLUDE') {
      return;
    }

    if (currentCluster.length === 0) {
      currentCluster.push(file);
      return;
    }

    const anchorFile = currentCluster[0];
    const previousFile = currentCluster[currentCluster.length - 1];
    let isConnected = false;

    // Signal 1: Proximity in time (within 6h of previous file, within 18h of cluster start)
    if (file.captureDate && previousFile.captureDate && anchorFile.captureDate) {
      if (isWithinHours(file.captureDate, previousFile.captureDate, 6) && 
          isWithinHours(file.captureDate, anchorFile.captureDate, 18)) {
        isConnected = true;
      }
    }

    // Signal 2: Common meaningful folder name
    if (file.folderName && previousFile.folderName && 
        isMeaningfulFolder(file.folderName) && 
        file.folderName.toLowerCase() === previousFile.folderName.toLowerCase()) {
      isConnected = true;
    }

    // Signal 3: GPS proximity (within 3km)
    if (file.gps && previousFile.gps) {
      const dist = calculateGpsDistanceKm(file.gps.latitude, file.gps.longitude, previousFile.gps.latitude, previousFile.gps.longitude);
      if (dist != null && dist <= 3.0) {
        isConnected = true;
      }
    }

    // Signal 4: Perceptual Visual Similarity (Hamming distance <= 14)
    if (file.visualMetrics?.pHash && previousFile.visualMetrics?.pHash) {
      const dist = calculateHammingDistance(file.visualMetrics.pHash, previousFile.visualMetrics.pHash);
      if (dist <= 14) {
        isConnected = true;
      }
    }

    // Signal 5: Sequential filename burst (e.g. IMG_1041.jpg, IMG_1042.jpg)
    if (isSequentialFilename(file.originalFilename, previousFile.originalFilename)) {
      isConnected = true;
    }

    if (isConnected) {
      currentCluster.push(file);
    } else {
      clusters.push(currentCluster);
      currentCluster = [file];
    }
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // =========================================================================
  // STAGE 6: EVALUATE CLUSTERS & SELECT COVERS
  // =========================================================================
  clusters.forEach((cluster, idx) => {
    if (cluster.length >= 2) {
      const dates = cluster.map(f => f.captureDate).filter(Boolean);
      const verifiedDates = cluster.filter(f => f.isVerifiedMetadata && f.captureDate);
      const hasVerifiedDates = verifiedDates.length >= 2;
      const hasFolder = isMeaningfulFolder(cluster[0]?.folderName) && cluster.every(f => f.folderName === cluster[0].folderName);
      
      const filesWithGps = cluster.filter(f => f.gps);
      const hasGps = filesWithGps.length >= 2;

      let hasSequential = false;
      for (let i = 1; i < cluster.length; i++) {
        if (isSequentialFilename(cluster[i].originalFilename, cluster[i - 1].originalFilename)) {
          hasSequential = true;
          break;
        }
      }

      let signalCount = 0;
      const reasons = [];

      if (hasVerifiedDates) {
        signalCount += 1;
        reasons.push(`${cluster.length} files with matching EXIF capture timestamps (within 6h)`);
      } else if (dates.length >= 2) {
        signalCount += 0.5;
        reasons.push(`${cluster.length} files with close chronological timestamps`);
      }

      if (hasFolder) {
        signalCount += 1;
        reasons.push(`Shared source folder: "${cluster[0].folderName}"`);
      }

      if (hasGps) {
        signalCount += 1;
        const d = calculateGpsDistanceKm(
          filesWithGps[0].gps.latitude, filesWithGps[0].gps.longitude,
          filesWithGps[1].gps.latitude, filesWithGps[1].gps.longitude
        );
        reasons.push(`Matching GPS location${d != null ? ` (within ${d.toFixed(1)} km)` : ''}`);
      }

      if (hasSequential) {
        signalCount += 1;
        reasons.push('Consecutive camera shutter sequence detected');
      }

      // Check average visual quality
      const avgQuality = Math.round(cluster.reduce((acc, f) => acc + (f.classification?.qualityScore || 60), 0) / cluster.length);
      reasons.push(`Average visual quality: ${avgQuality}/100`);

      if (signalCount < 1.0) {
        unorganized.push(...cluster);
        return;
      }

      let confidenceLevel = 'low';
      if (signalCount >= 2.0) confidenceLevel = 'high';
      else if (signalCount >= 1.0) confidenceLevel = 'medium';

      const confidence = confidenceLevel === 'high' 
        ? 'HIGH CONFIDENCE' 
        : (confidenceLevel === 'medium' ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE');

      const suggestedDate = dates.length > 0 ? dates[0] : null;
      const dateStatus = hasVerifiedDates ? 'verified' : (dates.length > 0 ? 'inferred' : 'unknown');

      const gpsFile = cluster.find(f => f.gps);
      let suggestedLocation = null;
      let locationStatus = 'unknown';
      if (gpsFile && gpsFile.gps) {
        suggestedLocation = `${gpsFile.gps.latitude.toFixed(3)}°, ${gpsFile.gps.longitude.toFixed(3)}°`;
        locationStatus = 'verified';
      }

      // Recommend Best Cover Photographs
      const coverCandidates = selectBestCoverCandidates(cluster);
      const primaryCover = coverCandidates[0]?.file || cluster[0];

      // Separate recommended picks vs secondary review
      const recommendedFiles = cluster.filter(f => f.classification?.category === 'KEEP');
      const reviewFiles = cluster.filter(f => f.classification?.category === 'REVIEW');

      const suggestedTitle = suggestMemoryTitle(cluster, cluster[0].visionAnalysis?.scene);

      suggestedNew.push({
        id: `new-group-${Date.now()}-${idx}`,
        type: 'suggest_new',
        suggestedTitle,
        suggestedDate,
        dateStatus,
        suggestedLocation,
        locationStatus,
        suggestedCategory: 'coll-keepsakes',
        suggestedMood: 'happy',
        files: cluster,
        recommendedFiles: recommendedFiles.length > 0 ? recommendedFiles : cluster,
        reviewFiles,
        coverCandidates,
        selectedCoverId: primaryCover.id,
        confidence,
        confidenceLevel,
        reasons,
      });
    } else {
      unorganized.push(...cluster);
    }
  });

  // Calculate high-level overview metrics
  const recommendedCount = unassignedFiles.filter(f => f.classification?.category === 'KEEP').length;
  const reviewCount = unassignedFiles.filter(f => f.classification?.category === 'REVIEW').length;
  const excludedCount = unassignedFiles.filter(f => f.classification?.category === 'EXCLUDE').length;

  onProgress?.({ stage: 'Curation complete', percent: 100 });

  return {
    matchExisting,
    suggestedNew,
    archiveGroup: {
      title: 'Archive & Documents',
      description: 'Tickets, receipts, documents, and screenshots retained safely in your personal vault.',
      files: archiveFiles,
    },
    duplicateGroup: {
      exact: exactGroups,
      near: nearGroups,
      totalCount: duplicateResults.totalExactDuplicates + duplicateResults.totalNearDuplicates,
    },
    burstGroup: {
      bursts: burstGroups,
      totalCount: duplicateResults.totalBurstSequences,
    },
    unorganized,
    overview: {
      totalAnalyzed: totalFiles,
      recommendedCount,
      reviewCount,
      archiveCount: archiveFiles.length,
      exactDuplicateCount: duplicateResults.totalExactDuplicates,
      nearDuplicateCount: duplicateResults.totalNearDuplicates,
      burstCount: duplicateResults.totalBurstSequences,
      excludedCount,
      unorganizedCount: unorganized.length,
      suggestedMemoriesCount: suggestedNew.length,
      existingMatchesCount: matchExisting.length,
    },
  };
}
