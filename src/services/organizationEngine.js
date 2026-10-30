// Intelligent Memory Organization Engine for Dostflix Memory Studio
// Analyzes uploaded files, detects existing memory matches, forms temporal & spatial clusters,
// and computes confidence scores for suggestion review.

// Haversine distance in kilometers between two GPS coordinates
export function calculateGpsDistanceKm(lat1, lon1, lat2, lon2) {
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

// Check if two timestamps are within a given time window (in hours)
export function isWithinHours(dateStr1, dateStr2, maxHours = 8) {
  if (!dateStr1 || !dateStr2) return false;
  const t1 = new Date(dateStr1).getTime();
  const t2 = new Date(dateStr2).getTime();
  if (isNaN(t1) || isNaN(t2)) return false;
  const diffHours = Math.abs(t1 - t2) / (1000 * 60 * 60);
  return diffHours <= maxHours;
}

// Generate smart title from folder, date, or filename
export function suggestMemoryTitle(files) {
  if (!files || files.length === 0) return 'Untitled Memory';

  // 1. If files share a non-empty folder name (e.g., "Goa Trip", "Photobooth")
  const folderNames = files.map(f => f.folderName).filter(Boolean);
  if (folderNames.length > 0) {
    const counts = {};
    folderNames.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    const topFolder = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    if (topFolder && topFolder.toLowerCase() !== 'media' && topFolder.toLowerCase() !== 'dcim') {
      return topFolder
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  // 2. Derive from common capture date
  const dates = files.map(f => f.captureDate).filter(Boolean);
  if (dates.length > 0) {
    const firstDate = new Date(dates[0]);
    if (!isNaN(firstDate.getTime())) {
      const monthYear = firstDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const day = firstDate.getDate();
      return `Squad Gathering — ${day} ${monthYear}`;
    }
  }

  return `Squad Moments — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

// Main Analysis Function
export function analyzeAndOrganizeBatch(uploadedMediaList, existingMemories = []) {
  const matchExisting = []; // Matches to existing memories
  const suggestedNew = [];  // New group suggestions
  const unorganized = [];   // Isolated / low-confidence files

  // Exclude files that are already assigned to a memory
  const unassignedFiles = uploadedMediaList.filter(f => !f.assignedMemoryId);
  const remainingFiles = [...unassignedFiles];

  // STEP 1: COMPARE AGAINST EXISTING MEMORIES
  existingMemories.forEach(memory => {
    const memoryDate = memory.date ? new Date(memory.date) : null;
    const memoryTitleLower = (memory.title || '').toLowerCase();
    const memoryLocationLower = (memory.location || '').toLowerCase();
    const matchedFiles = [];
    const matchReasons = new Set();
    let totalScore = 0;

    remainingFiles.forEach(file => {
      let fileScore = 0;
      const fileReasons = [];

      // Check capture date vs memory date (within 48 hours)
      if (file.captureDate && memoryDate && !isNaN(memoryDate.getTime())) {
        const fileDate = new Date(file.captureDate);
        const dayDiff = Math.abs(fileDate.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff <= 1.0) {
          fileScore += 50;
          fileReasons.push('Matching capture date');
        } else if (dayDiff <= 3.0) {
          fileScore += 25;
          fileReasons.push('Close date proximity');
        }
      }

      // Check folder or filename matching memory title/location
      const filenameLower = (file.originalFilename || '').toLowerCase();
      const folderLower = (file.folderName || '').toLowerCase();

      if (memoryLocationLower && (filenameLower.includes(memoryLocationLower) || folderLower.includes(memoryLocationLower))) {
        fileScore += 35;
        fileReasons.push(`Location matched: ${memory.location}`);
      }

      if (folderLower && memoryTitleLower.includes(folderLower)) {
        fileScore += 35;
        fileReasons.push(`Folder name matches memory: "${file.folderName}"`);
      }

      // Check GPS proximity if both have coordinates
      if (file.gps && memory.coordinates) {
        const dist = calculateGpsDistanceKm(
          file.gps.latitude,
          file.gps.longitude,
          memory.coordinates.latitude || memory.coordinates.lat,
          memory.coordinates.longitude || memory.coordinates.lng
        );
        if (dist <= 5.0) {
          fileScore += 45;
          fileReasons.push(`Within ${(dist).toFixed(1)} km of memory location`);
        }
      }

      // Threshold to consider matched to this existing memory
      if (fileScore >= 35) {
        matchedFiles.push({ file, score: fileScore });
        fileReasons.forEach(r => matchReasons.add(r));
        totalScore += fileScore;
      }
    });

    if (matchedFiles.length > 0) {
      // Calculate overall confidence level
      const avgScore = totalScore / matchedFiles.length;
      const confidence = avgScore >= 60 ? 'HIGH CONFIDENCE' : (avgScore >= 35 ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE');

      matchExisting.push({
        id: `match-${memory.id}-${Date.now()}`,
        type: 'match_existing',
        targetMemory: memory,
        files: matchedFiles.map(m => m.file),
        reasons: Array.from(matchReasons),
        confidence,
        confidenceLevel: confidence === 'HIGH CONFIDENCE' ? 'high' : (confidence === 'MEDIUM CONFIDENCE' ? 'medium' : 'low'),
      });

      // Remove matched files from remaining pool
      const matchedIds = new Set(matchedFiles.map(m => m.file.id));
      for (let i = remainingFiles.length - 1; i >= 0; i--) {
        if (matchedIds.has(remainingFiles[i].id)) {
          remainingFiles.splice(i, 1);
        }
      }
    }
  });

  // STEP 2: CLUSTER REMAINING FILES INTO NEW MEMORIES
  // Sort remaining files by captureDate (or lastModified)
  remainingFiles.sort((a, b) => {
    const tA = a.captureDate ? new Date(a.captureDate).getTime() : 0;
    const tB = b.captureDate ? new Date(b.captureDate).getTime() : 0;
    return tA - tB;
  });

  const clusters = [];
  let currentCluster = [];

  remainingFiles.forEach(file => {
    if (currentCluster.length === 0) {
      currentCluster.push(file);
      return;
    }

    const previousFile = currentCluster[currentCluster.length - 1];
    let isConnected = false;

    // Signal 1: Proximity in time (within 10 hours)
    if (file.captureDate && previousFile.captureDate) {
      if (isWithinHours(file.captureDate, previousFile.captureDate, 10)) {
        isConnected = true;
      }
    }

    // Signal 2: Common folder name
    if (file.folderName && previousFile.folderName && file.folderName.toLowerCase() === previousFile.folderName.toLowerCase()) {
      isConnected = true;
    }

    // Signal 3: GPS proximity (within 3km)
    if (file.gps && previousFile.gps) {
      const dist = calculateGpsDistanceKm(file.gps.latitude, file.gps.longitude, previousFile.gps.latitude, previousFile.gps.longitude);
      if (dist <= 3.0) {
        isConnected = true;
      }
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

  // Evaluate clusters: groups with 2 or more files become suggested new memories;
  // single isolated files with no strong date/location go to unorganized
  clusters.forEach((cluster, idx) => {
    if (cluster.length >= 2) {
      const dates = cluster.map(f => f.captureDate).filter(Boolean);
      const suggestedDate = dates.length > 0 ? dates[0] : new Date().toISOString();
      const suggestedTitle = suggestMemoryTitle(cluster);
      
      // Determine confidence
      const hasVerifiedDates = cluster.some(f => f.isVerifiedMetadata);
      const hasGps = cluster.some(f => f.gps);
      const hasFolder = cluster.some(f => f.folderName);
      let confidence = 'MEDIUM CONFIDENCE';
      if (hasVerifiedDates && (hasGps || hasFolder)) {
        confidence = 'HIGH CONFIDENCE';
      } else if (!hasVerifiedDates && !hasFolder) {
        confidence = 'LOW CONFIDENCE';
      }

      suggestedNew.push({
        id: `new-group-${Date.now()}-${idx}`,
        type: 'suggest_new',
        suggestedTitle,
        suggestedDate,
        suggestedLocation: cluster.find(f => f.gps)?.locationName || 'Squad Hangout',
        suggestedCategory: 'coll-keepsakes',
        suggestedMood: 'happy',
        files: cluster,
        confidence,
        confidenceLevel: confidence === 'HIGH CONFIDENCE' ? 'high' : (confidence === 'MEDIUM CONFIDENCE' ? 'medium' : 'low'),
        reasons: [
          `${cluster.length} files captured in close temporal sequence`,
          hasFolder ? `Shared folder: "${cluster[0].folderName}"` : null,
          hasGps ? 'Matching GPS coordinates' : null,
        ].filter(Boolean),
      });
    } else {
      // Single isolated file
      unorganized.push(...cluster);
    }
  });

  return {
    matchExisting,
    suggestedNew,
    unorganized,
    totalAnalyzed: unassignedFiles.length,
  };
}
