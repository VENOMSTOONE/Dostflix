import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MapPin, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  Edit2,
  CheckCircle2,
  Inbox,
  Layers,
  Copy,
  Zap,
  Archive,
  Image as ImageIcon,
  Video,
  Award,
  Filter,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';
import MediaThumbnail from './MediaThumbnail';
import MediaLightbox from './MediaLightbox';

// Format byte size for metadata badges
const formatBytes = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Extract dimensions string (e.g., "4032×3024")
const getDimensionsStr = (item) => {
  const w = item?.metadata?.width || item?.dimensions?.width;
  const h = item?.metadata?.height || item?.dimensions?.height;
  return w && h ? `${w}×${h}` : null;
};

// Extract uppercase format string (e.g., "HEIC", "JPG")
const getFormatStr = (item) => {
  if (item?.metadata?.format) return item.metadata.format.toUpperCase();
  if (item?.fileBlob?.type) {
    const ext = item.fileBlob.type.split('/')[1];
    return ext ? ext.toUpperCase() : '';
  }
  if (item?.originalFilename) {
    const parts = item.originalFilename.split('.');
    if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
  }
  if (item?.filename) {
    const parts = item.filename.split('.');
    if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
  }
  return '';
};

// Extract formatted capture or modification time (e.g., "14:23:05")
const formatTimeStr = (item) => {
  if (item?.captureDate) {
    const d = new Date(item.captureDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  if (item?.lastModified) {
    const d = new Date(item.lastModified);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  return '';
};

export default function OrganizationReviewModal({
  isOpen = false,
  analysisResults = { 
    matchExisting: [], 
    suggestedNew: [], 
    archiveGroup: { files: [] }, 
    duplicateGroup: { exact: [], formatVariants: [], near: [], totalCount: 0 },
    burstGroup: { bursts: [], totalCount: 0 },
    unorganized: [],
    overview: {} 
  },
  onClose,
  onApplyMatches,
  onCreateSuggestedMemories,
  onKeepInInbox,
}) {
  const { currentTheme } = useTheme();

  // Active top tab: 'memories' | 'duplicates' | 'archive' | 'unorganized'
  const [activeTab, setActiveTab] = useState('memories');

  // Local editable state so the user has 100% control
  const [matches, setMatches] = useState(() => analysisResults.matchExisting || []);
  const [newGroups, setNewGroups] = useState(() => analysisResults.suggestedNew || []);
  const [archiveFiles, setArchiveFiles] = useState(() => analysisResults.archiveGroup?.files || []);
  const [duplicateGroups, setDuplicateGroups] = useState(() => analysisResults.duplicateGroup || { exact: [], formatVariants: [], near: [] });
  const [burstGroups, setBurstGroups] = useState(() => analysisResults.burstGroup?.bursts || []);
  const [unorganized, setUnorganized] = useState(() => analysisResults.unorganized || []);

  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Group media tier filter: 'all' | 'recommended' | 'review' | 'excluded'
  const [groupFilter, setGroupFilter] = useState('all');

  // Lightbox state
  const [lightboxItems, setLightboxItems] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sync state if analysisResults changes
  useEffect(() => {
    if (analysisResults) {
      setMatches(analysisResults.matchExisting || []);
      setNewGroups(analysisResults.suggestedNew || []);
      setArchiveFiles(analysisResults.archiveGroup?.files || []);
      setDuplicateGroups(analysisResults.duplicateGroup || { exact: [], formatVariants: [], near: [] });
      setBurstGroups(analysisResults.burstGroup?.bursts || []);
      setUnorganized(analysisResults.unorganized || []);
      if (analysisResults.suggestedNew?.length > 0) {
        setExpandedGroupId(analysisResults.suggestedNew[0].id);
      }
    }
  }, [analysisResults]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLightboxOpen, onClose]);

  if (!isOpen) return null;

  // Dynamic Overview counts derived from active state
  const totalAnalyzed = analysisResults.overview?.totalAnalyzed || 0;
  const exactCount = duplicateGroups.exact?.reduce((acc, g) => acc + (g.duplicates?.length || 0), 0) || 0;
  const formatVariantCount = duplicateGroups.formatVariants?.reduce((acc, g) => acc + (g.duplicates?.length || 0), 0) || 0;
  const nearCount = duplicateGroups.near?.reduce((acc, g) => acc + (g.duplicates?.length || 0), 0) || 0;
  const duplicateCount = exactCount + formatVariantCount + nearCount;
  const burstCount = burstGroups.length;
  const recommendedCount = newGroups.reduce((acc, g) => acc + (g.recommendedFiles?.length || 0), 0) + matches.reduce((acc, m) => acc + m.files.length, 0);
  const reviewCount = newGroups.reduce((acc, g) => acc + (g.reviewFiles?.length || 0), 0);

  // Open lightbox
  const handleOpenLightbox = (itemList, index = 0) => {
    setLightboxItems(itemList);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // Check if an item is currently classified as KEEP in any recommended memory group
  const isItemIncluded = (fileId) => {
    return newGroups.some((g) => g.recommendedFiles?.some((f) => f.id === fileId));
  };

  // Switch canonical representative in duplicate / variant group
  const handleSetCanonical = (groupType, groupId, newCanonical) => {
    soundFx.playPop();
    const listKey = groupType;
    setDuplicateGroups((prev) => {
      const updatedList = (prev[listKey] || []).map((g) => {
        if (g.id === groupId) {
          const newDuplicates = g.allFiles.filter((f) => f.id !== newCanonical.id);
          return {
            ...g,
            canonical: newCanonical,
            duplicates: newDuplicates,
          };
        }
        return g;
      });
      return { ...prev, [listKey]: updatedList };
    });

    // In newGroups, make newCanonical KEEP, and ensure old duplicates stay in their respective states
    setNewGroups((prev) =>
      prev.map((g) => {
        const hasNewCanonical = g.files.some((f) => f.id === newCanonical.id);
        if (!hasNewCanonical) return g;
        const updatedFiles = g.files.map((f) => {
          if (f.id === newCanonical.id) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: 'KEEP',
                badgeColor: 'green',
                badgeLabel: 'Recommended',
                reason: 'Selected as primary representative.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Keep Recommended: canonical remains KEEP, duplicates marked EXCLUDED
  const handleKeepRecommended = (group) => {
    soundFx.playPop();
    const dupIds = new Set(group.duplicates.map((f) => f.id));
    setNewGroups((prev) =>
      prev.map((g) => {
        const updatedFiles = g.files.map((f) => {
          if (f.id === group.canonical.id) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: 'KEEP',
                badgeColor: 'green',
                badgeLabel: 'Recommended',
                reason: 'Primary representative preserved.',
              },
            };
          }
          if (dupIds.has(f.id)) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: 'EXCLUDED',
                badgeColor: 'red',
                badgeLabel: 'Duplicate',
                reason: 'Duplicate copy filtered from presentation.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Toggle duplicate copy inclusion
  const handleToggleDuplicateInclusion = (duplicateItem) => {
    soundFx.playClick();
    const isCurrentlyIncluded = isItemIncluded(duplicateItem.id);
    const newCategory = isCurrentlyIncluded ? 'EXCLUDED' : 'KEEP';

    setNewGroups((prev) =>
      prev.map((g) => {
        const hasFile = g.files.some((f) => f.id === duplicateItem.id);
        if (!hasFile) return g;
        const updatedFiles = g.files.map((f) => {
          if (f.id === duplicateItem.id) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: newCategory,
                badgeColor: newCategory === 'KEEP' ? 'green' : 'red',
                badgeLabel: newCategory === 'KEEP' ? 'Recommended' : 'Duplicate',
                reason: newCategory === 'KEEP' ? 'User included duplicate copy in memory.' : 'Duplicate copy filtered from presentation.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Keep all duplicates in group as recommended
  const handleKeepAllDuplicates = (group) => {
    soundFx.playPop();
    const allIds = new Set(group.allFiles.map((f) => f.id));
    setNewGroups((prev) =>
      prev.map((g) => {
        const updatedFiles = g.files.map((f) => {
          if (allIds.has(f.id)) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: 'KEEP',
                badgeColor: 'green',
                badgeLabel: 'Recommended',
                reason: 'User included all duplicates in memory.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Keep recommended burst frames only
  const handleKeepRecommendedBurst = (burst) => {
    soundFx.playPop();
    const recIds = new Set(burst.recommended.map((f) => f.id));
    const allBurstIds = new Set(burst.allFiles.map((f) => f.id));
    setNewGroups((prev) =>
      prev.map((g) => {
        const updatedFiles = g.files.map((f) => {
          if (allBurstIds.has(f.id)) {
            const isRec = recIds.has(f.id);
            return {
              ...f,
              classification: {
                ...f.classification,
                category: isRec ? 'KEEP' : 'EXCLUDED',
                badgeColor: isRec ? 'green' : 'red',
                badgeLabel: isRec ? 'Recommended' : 'Burst Duplicate',
                reason: isRec ? 'Top burst pick preserved.' : 'Burst frame excluded to reduce clutter.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Toggle single burst frame inclusion
  const handleToggleBurstFrame = (burstId, file) => {
    soundFx.playClick();
    const isCurrentlyIncluded = isItemIncluded(file.id);
    const newCategory = isCurrentlyIncluded ? 'EXCLUDED' : 'KEEP';

    setNewGroups((prev) =>
      prev.map((g) => {
        const hasFile = g.files.some((f) => f.id === file.id);
        if (!hasFile) return g;
        const updatedFiles = g.files.map((f) => {
          if (f.id === file.id) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: newCategory,
                badgeColor: newCategory === 'KEEP' ? 'green' : 'red',
                badgeLabel: newCategory === 'KEEP' ? 'Recommended' : 'Burst Duplicate',
                reason: newCategory === 'KEEP' ? 'User included burst frame.' : 'Burst frame excluded.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Keep all burst frames in memory
  const handleKeepAllBurstFrames = (burstId) => {
    soundFx.playPop();
    const burst = burstGroups.find((b) => b.id === burstId);
    if (!burst) return;
    const burstIds = new Set(burst.allFiles.map((f) => f.id));

    setNewGroups((prev) =>
      prev.map((g) => {
        const updatedFiles = g.files.map((f) => {
          if (burstIds.has(f.id)) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: 'KEEP',
                badgeColor: 'green',
                badgeLabel: 'Recommended',
                reason: 'User included all burst frames in memory.',
              },
            };
          }
          return f;
        });
        const rec = updatedFiles.filter((f) => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter((f) => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles: rec, reviewFiles: rev };
      })
    );
  };

  // Toggle group accordion
  const toggleExpand = (groupId) => {
    soundFx.playClick();
    setExpandedGroupId(prev => prev === groupId ? null : groupId);
  };

  // Start inline title editing
  const handleStartRename = (group) => {
    soundFx.playClick();
    setEditingGroupId(group.id);
    setTempTitle(group.suggestedTitle);
  };

  // Save renamed memory title
  const handleSaveRename = (groupId) => {
    soundFx.playPop();
    if (tempTitle.trim()) {
      setNewGroups(prev => prev.map(g => g.id === groupId ? { ...g, suggestedTitle: tempTitle.trim() } : g));
    }
    setEditingGroupId(null);
  };

  // Select hero cover photo
  const handleSelectCover = (groupId, fileId) => {
    soundFx.playPop();
    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, selectedCoverId: fileId };
      }
      return g;
    }));
  };

  // Change individual item category: 'KEEP' | 'REVIEW' | 'EXCLUDE'
  const handleChangeItemCategory = (groupId, fileId, newCategory) => {
    soundFx.playClick();
    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const updatedFiles = g.files.map(f => {
          if (f.id === fileId) {
            const badgeLabel = newCategory === 'KEEP' ? 'Keep' : (newCategory === 'REVIEW' ? 'Review' : 'Exclude');
            const badgeColor = newCategory === 'KEEP' ? 'green' : (newCategory === 'REVIEW' ? 'yellow' : 'red');
            return {
              ...f,
              classification: {
                ...f.classification,
                category: newCategory,
                badgeLabel,
                badgeColor,
                reason: `Manually set to ${badgeLabel} by user.`,
              }
            };
          }
          return f;
        });

        const rec = updatedFiles.filter(f => f.classification?.category === 'KEEP');
        const rev = updatedFiles.filter(f => f.classification?.category === 'REVIEW');
        return {
          ...g,
          files: updatedFiles,
          recommendedFiles: rec,
          reviewFiles: rev
        };
      }
      return g;
    }));
  };

  // Remove file from group and move to unorganized
  const handleRemoveFileFromGroup = (groupId, fileId) => {
    soundFx.playPop();
    let fileToMove = null;

    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        fileToMove = g.files.find(f => f.id === fileId);
        return {
          ...g,
          files: g.files.filter(f => f.id !== fileId),
          recommendedFiles: g.recommendedFiles?.filter(f => f.id !== fileId) || []
        };
      }
      return g;
    }).filter(g => g.files.length > 0));

    if (fileToMove) {
      setUnorganized(prev => [fileToMove, ...prev]);
    }
  };

  // Move an archive file to a new memory or promote it
  const handlePromoteArchiveFile = (file) => {
    soundFx.playPop();
    setArchiveFiles(prev => prev.filter(f => f.id !== file.id));
    const promoted = {
      ...file,
      classification: {
        ...file.classification,
        category: 'KEEP',
        badgeColor: 'green',
        badgeLabel: 'Recommended',
        reason: 'User promoted from Archive to Memory.',
      }
    };
    setUnorganized(prev => [promoted, ...prev]);
    setActiveTab('unorganized');
  };

  // 1-Click: Accept All High Confidence Suggestions
  const handleAcceptHighConfidence = async () => {
    soundFx.playPop();
    setIsApplying(true);

    const highMatches = matches.filter(m => m.confidenceLevel === 'high');
    const highNewGroups = newGroups.filter(g => g.confidenceLevel === 'high');

    if (highMatches.length > 0) {
      await onApplyMatches(highMatches);
    }
    if (highNewGroups.length > 0) {
      await onCreateSuggestedMemories(highNewGroups);
    }

    const remainingMatches = matches.filter(m => m.confidenceLevel !== 'high');
    const remainingNew = newGroups.filter(g => g.confidenceLevel !== 'high');

    setMatches(remainingMatches);
    setNewGroups(remainingNew);
    setIsApplying(false);

    if (remainingMatches.length === 0 && remainingNew.length === 0) {
      onClose();
    }
  };

  // Apply All remaining approved changes
  const handleConfirmAll = async () => {
    soundFx.playPop();
    setIsApplying(true);

    try {
      if (matches.length > 0) {
        await onApplyMatches(matches);
      }
      if (newGroups.length > 0) {
        await onCreateSuggestedMemories(newGroups);
      }
      if (unorganized.length > 0) {
        await onKeepInInbox?.(unorganized);
      }
    } finally {
      setIsApplying(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      
      {/* Lightbox for inspecting high-res details */}
      <MediaLightbox
        isOpen={isLightboxOpen}
        items={lightboxItems}
        initialIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-6xl h-[92vh] flex flex-col bg-[#0d0d12] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Subtle Ambient Top Border Accent */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        {/* ============================================================== */}
        {/* ZONE 1: FIXED MODAL HEADER                                      */}
        {/* ============================================================== */}
        <header className="sticky top-0 z-30 shrink-0 bg-[#0d0d12]/95 backdrop-blur-md border-b border-white/[0.08] px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-zinc-400 tracking-[0.18em] uppercase font-mono">
                  Dostflix Intelligence
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Vision Engine
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                Intelligent Memory Curation
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Close (Esc)"
            >
              <X size={16} />
              <span className="hidden sm:inline font-mono text-[10px] text-zinc-500">Esc</span>
            </button>
          </div>
        </header>

        {/* ============================================================== */}
        {/* ZONE 2: COMPACT RESTRAINED SUMMARY STAT BAR                     */}
        {/* ============================================================== */}
        <div className="shrink-0 px-5 sm:px-7 py-3 bg-zinc-950/70 border-b border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-center">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Analyzed</span>
            <span className="text-sm sm:text-base font-bold text-white mt-0.5">{totalAnalyzed} files</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-center">
            <span className="text-[10px] font-medium text-emerald-400/90 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Recommended
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-300 mt-0.5">{recommendedCount} items</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-center">
            <span className="text-[10px] font-medium text-amber-400/90 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Needs Review
            </span>
            <span className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">{reviewCount} items</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-center">
            <span className="text-[10px] font-medium text-purple-400/90 uppercase tracking-wider flex items-center gap-1">
              <Copy size={10} /> Duplicates
            </span>
            <span className="text-sm sm:text-base font-bold text-purple-300 mt-0.5">{duplicateCount} files</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-center">
            <span className="text-[10px] font-medium text-blue-400/90 uppercase tracking-wider flex items-center gap-1">
              <Zap size={10} /> Burst Sets
            </span>
            <span className="text-sm sm:text-base font-bold text-blue-300 mt-0.5">{burstCount} sets</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/40 border border-white/[0.06] flex flex-col justify-center">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Archive size={10} /> Archive
            </span>
            <span className="text-sm sm:text-base font-bold text-zinc-300 mt-0.5">{archiveFiles.length} files</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ZONE 3: SEGMENTED NAVIGATION TABS                               */}
        {/* ============================================================== */}
        <div className="shrink-0 px-5 sm:px-7 py-2 bg-[#0d0d12] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('memories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'memories'
                ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles size={13} className={activeTab === 'memories' ? 'text-emerald-400' : 'text-zinc-400'} />
            Suggested Memories ({newGroups.length + matches.length})
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('duplicates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'duplicates'
                ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Copy size={13} className={activeTab === 'duplicates' ? 'text-purple-400' : 'text-zinc-400'} />
            Duplicates & Bursts ({duplicateCount + burstCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Archive size={13} className={activeTab === 'archive' ? 'text-zinc-200' : 'text-zinc-400'} />
            Archive & Documents ({archiveFiles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unorganized')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'unorganized'
                ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Inbox size={13} className={activeTab === 'unorganized' ? 'text-zinc-200' : 'text-zinc-400'} />
            Unorganized ({unorganized.length})
          </button>
        </div>

        {/* ============================================================== */}
        {/* ZONE 4: INDEPENDENTLY SCROLLABLE MAIN CONTENT                   */}
        {/* ============================================================== */}
        <main className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-7 py-6 space-y-6">

          {/* ============================================================== */}
          {/* TAB 1: SUGGESTED MEMORIES                                      */}
          {/* ============================================================== */}
          {activeTab === 'memories' && (
            <div className="space-y-6">
              
              {/* High Confidence Fast-Track Banner */}
              {(matches.some(m => m.confidenceLevel === 'high') || newGroups.some(g => g.confidenceLevel === 'high')) && (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">High Confidence Memories Ready</p>
                      <p className="text-[11px] text-zinc-400">Multiple verified signals (EXIF dates, GPS, visual similarity) matched with certainty.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAcceptHighConfidence}
                    disabled={isApplying}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Check size={14} strokeWidth={3} />
                    Accept High Confidence
                  </button>
                </div>
              )}

              {newGroups.length === 0 && matches.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 flex flex-col items-center">
                  <Inbox size={40} className="text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">No memory groupings available</p>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1">All uploaded files were either classified as documents, duplicates, or placed in unorganized storage.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Suggested New Memory Cards */}
                  {newGroups.map((group) => {
                    const isExpanded = expandedGroupId === group.id;
                    const isEditing = editingGroupId === group.id;
                    const activeCover = group.coverCandidates?.find(c => c.file.id === group.selectedCoverId)?.file || group.files[0];

                    const displayedFiles = groupFilter === 'all'
                      ? group.files
                      : (groupFilter === 'recommended'
                        ? group.files.filter(f => f.classification?.category === 'KEEP')
                        : (groupFilter === 'review'
                          ? group.files.filter(f => f.classification?.category === 'REVIEW')
                          : group.files.filter(f => f.classification?.category === 'EXCLUDE')));

                    const photoCount = group.files.filter(f => !f.mediaType?.startsWith('video')).length;
                    const videoCount = group.files.filter(f => f.mediaType?.startsWith('video') || f.fileType?.startsWith('video')).length;

                    return (
                      <div 
                        key={group.id} 
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'bg-zinc-900/60 border-white/20 shadow-xl' 
                            : 'bg-zinc-900/35 border-white/[0.08] hover:border-white/[0.14]'
                        }`}
                      >
                        {/* Group Header Card */}
                        <div 
                          onClick={() => toggleExpand(group.id)}
                          className="p-4 sm:p-5 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-start sm:items-center gap-4 min-w-0">
                            {/* Cinematic Poster Preview */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/10 bg-zinc-950 shrink-0 shadow-md">
                              <img 
                                src={activeCover?.previewUrl || activeCover?.thumbnail} 
                                alt={group.suggestedTitle} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-amber-300">
                                <Award size={10} />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                {isEditing ? (
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={tempTitle}
                                      onChange={e => setTempTitle(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(group.id); }}
                                      className="px-2.5 py-1 text-sm bg-zinc-950 border border-white/20 rounded-lg text-white outline-none focus:ring-1 focus:ring-white/40"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRename(group.id)}
                                      className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group/edit">
                                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                                      {group.suggestedTitle}
                                    </h3>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartRename(group);
                                      }}
                                      className="p-1 rounded text-zinc-500 hover:text-white transition-opacity"
                                      title="Edit title"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  </div>
                                )}

                                {/* Confidence Pill */}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1 ${
                                  group.confidenceLevel === 'high'
                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                    : (group.confidenceLevel === 'medium'
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-400')
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    group.confidenceLevel === 'high' ? 'bg-emerald-400' : 'bg-amber-400'
                                  }`} />
                                  {group.confidence}
                                </span>
                              </div>

                              {/* Verified vs Inferred Metadata Badges */}
                              <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                                {group.suggestedDate ? (
                                  <span className="flex items-center gap-1.5">
                                    <Calendar size={12} className={group.dateStatus === 'verified' ? 'text-emerald-400' : 'text-zinc-400'} />
                                    <span>{new Date(group.suggestedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                      group.dateStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-zinc-500'
                                    }`}>
                                      {group.dateStatus === 'verified' ? 'Verified EXIF' : 'Inferred'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Date Unknown</span>
                                )}

                                {group.suggestedLocation ? (
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={12} className={group.locationStatus === 'verified' ? 'text-emerald-400' : 'text-zinc-400'} />
                                    <span>{group.suggestedLocation}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                      group.locationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/5 text-zinc-500'
                                    }`}>
                                      {group.locationStatus === 'verified' ? 'Verified GPS' : 'Inferred'}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Location Unknown</span>
                                )}

                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-300 font-medium">
                                  {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}{videoCount > 0 ? ` • ${videoCount} ${videoCount === 1 ? 'Video' : 'Videos'}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                            <span className="text-xs text-zinc-400 font-medium">
                              {isExpanded ? 'Collapse' : 'Review & Curate'}
                            </span>
                            <div className={`p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Group Details & Interactive Curation */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-white/[0.08] p-4 sm:p-6 bg-zinc-950/70 space-y-6"
                            >
                              {/* Grouping Rationale Box */}
                              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5 font-mono">
                                  Evidence & Grouping Rationale
                                </span>
                                <ul className="text-xs text-zinc-300 space-y-1">
                                  {group.reasons?.map((r, rIdx) => (
                                    <li key={rIdx} className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                      <span>{r}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Recommended Hero Cover Selection */}
                              {group.coverCandidates && group.coverCandidates.length > 0 && (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                      <Award size={13} className="text-amber-400" />
                                      Candidate Covers (Click to select hero cover):
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {group.coverCandidates.map((cand, cIdx) => {
                                      const isChosen = (group.selectedCoverId || activeCover.id) === cand.file.id;
                                      return (
                                        <div
                                          key={cand.file.id}
                                          onClick={() => handleSelectCover(group.id, cand.file.id)}
                                          className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                            isChosen 
                                              ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/30' 
                                              : 'bg-zinc-900/60 border-white/[0.08] hover:border-white/20'
                                          }`}
                                        >
                                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black border border-white/10">
                                            <img src={cand.file.previewUrl || cand.file.thumbnail} alt="Cover candidate" className="w-full h-full object-cover" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs font-bold text-white truncate">Option {cIdx + 1}</span>
                                              {isChosen && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-400 text-zinc-950 rounded">
                                                  Selected Cover
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-snug">{cand.reason}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Curate Media Selection Grid */}
                              <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    Curate Media Selection ({group.files.length} items):
                                  </span>

                                  {/* Filter Segmented Control */}
                                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/[0.08] text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setGroupFilter('all')}
                                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${groupFilter === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                      All ({group.files.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setGroupFilter('recommended')}
                                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${groupFilter === 'recommended' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                      Recommended ({group.files.filter(f => f.classification?.category === 'KEEP').length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setGroupFilter('review')}
                                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${groupFilter === 'review' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-white'}`}
                                    >
                                      Review ({group.files.filter(f => f.classification?.category === 'REVIEW').length})
                                    </button>
                                  </div>
                                </div>

                                {/* Media Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                  {displayedFiles.map((file, idx) => {
                                    const cat = file.classification?.category || 'KEEP';
                                    const isCover = (group.selectedCoverId || activeCover.id) === file.id;

                                    return (
                                      <div key={file.id} className="relative group/card flex flex-col bg-zinc-900/40 p-2 rounded-xl border border-white/[0.06]">
                                        <MediaThumbnail
                                          item={file}
                                          aspectRatio="square"
                                          onClick={() => handleOpenLightbox(displayedFiles, idx)}
                                          onRemove={() => handleRemoveFileFromGroup(group.id, file.id)}
                                          showBadges={true}
                                          curationBadge={
                                            isCover 
                                              ? { label: 'Cover', color: 'gold' }
                                              : { 
                                                  label: file.classification?.badgeLabel || 'Keep', 
                                                  color: file.classification?.badgeColor || 'green' 
                                                }
                                          }
                                        />

                                        {/* File Metadata & 3-State Segmented Control */}
                                        <div className="mt-2 space-y-1.5">
                                          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                                            <span className="truncate max-w-[65%]" title={file.originalFilename}>{file.originalFilename}</span>
                                            <span>{getDimensionsStr(file) || getFormatStr(file)}</span>
                                          </div>

                                          {/* Accessible 3-State Control: Keep | Review | Exclude */}
                                          <div className="grid grid-cols-3 gap-1 text-[9px] pt-0.5">
                                            <button
                                              type="button"
                                              onClick={() => handleChangeItemCategory(group.id, file.id, 'KEEP')}
                                              className={`py-1 rounded font-bold transition-colors text-center ${
                                                cat === 'KEEP' 
                                                  ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm' 
                                                  : 'bg-white/[0.04] text-zinc-400 hover:text-emerald-300'
                                              }`}
                                            >
                                              Keep
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleChangeItemCategory(group.id, file.id, 'REVIEW')}
                                              className={`py-1 rounded font-bold transition-colors text-center ${
                                                cat === 'REVIEW' 
                                                  ? 'bg-amber-500 text-zinc-950 font-black shadow-sm' 
                                                  : 'bg-white/[0.04] text-zinc-400 hover:text-amber-300'
                                              }`}
                                            >
                                              Review
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleChangeItemCategory(group.id, file.id, 'EXCLUDE')}
                                              className={`py-1 rounded font-bold transition-colors text-center ${
                                                cat === 'EXCLUDE' 
                                                  ? 'bg-red-500 text-white font-black shadow-sm' 
                                                  : 'bg-white/[0.04] text-zinc-400 hover:text-red-300'
                                              }`}
                                            >
                                              Exclude
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DUPLICATES & BURST SEQUENCES                            */}
          {/* ============================================================== */}
          {activeTab === 'duplicates' && (
            <div className="space-y-8">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
                    <Copy size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Intelligent Duplicate & Burst Filtering</span>
                    <span className="text-zinc-300">
                      Cross-format variants, exact byte duplicates, visual near-duplicates, and rapid camera bursts are automatically filtered so your memories remain clean and diverse. Original files always remain safe in your vault.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: FORMAT VARIANTS DETECTED */}
              {duplicateGroups.formatVariants?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers size={15} className="text-teal-400" />
                      Format Variants Detected ({duplicateGroups.formatVariants.length} {duplicateGroups.formatVariants.length === 1 ? 'image' : 'images'} • {formatVariantCount} format copies)
                    </h3>
                    <span className="text-[10px] font-semibold text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                      Same Image — Different Formats
                    </span>
                  </div>

                  <div className="space-y-4">
                    {duplicateGroups.formatVariants.map((group) => {
                      const allCopiesKept = group.duplicates.every((d) => isItemIncluded(d.id));
                      return (
                        <div key={group.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-teal-500/20 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{group.reason}</span>
                                <div className="flex items-center gap-1">
                                  {group.formats.map((fmt) => (
                                    <span key={fmt} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                      {fmt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-zinc-400 mt-0.5 block">
                                Same visual image detected across multiple file formats. Recommended best version selected by resolution and format fidelity.
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleKeepRecommended(group)}
                                className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-xs font-semibold text-teal-300 hover:text-white transition-colors"
                              >
                                Keep Best Version
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKeepAllDuplicates(group)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  allCopiesKept
                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                                }`}
                              >
                                {allCopiesKept ? 'All Versions Kept' : 'Keep All Versions'}
                              </button>
                            </div>
                          </div>

                          {/* Side-by-Side Version Comparison Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Recommended Best Version Card */}
                            <div className="p-3 rounded-xl border-2 border-teal-400/60 bg-teal-500/[0.04] space-y-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-teal-400 text-zinc-950 text-[10px] font-black uppercase tracking-wide">
                                  Best Version ({getFormatStr(group.canonical)})
                                </span>
                                <span className="text-[10px] font-medium text-teal-300">
                                  Recommended
                                </span>
                              </div>

                              <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox(group.allFiles, 0)}>
                                <MediaThumbnail item={group.canonical} showFilename={false} />
                              </div>

                              <div className="space-y-1 text-[11px] text-zinc-400 pt-1">
                                <p className="font-semibold text-white truncate" title={group.canonical.originalFilename || group.canonical.filename}>
                                  {group.canonical.originalFilename || group.canonical.filename}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-400 font-mono">
                                  <span>{getFormatStr(group.canonical)} • {formatBytes(group.canonical.fileBlob?.size || group.canonical.fileSize || group.canonical.size)}</span>
                                  <span className="text-right">{getDimensionsStr(group.canonical) || 'Original'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Other Format Variants */}
                            {group.duplicates.map((dup, dIdx) => {
                              const isIncluded = isItemIncluded(dup.id);
                              return (
                                <div
                                  key={dup.id}
                                  className={`p-3 rounded-xl border space-y-2 transition-all relative ${
                                    isIncluded
                                      ? 'border-teal-500/40 bg-teal-500/[0.02]'
                                      : 'border-white/10 bg-zinc-900/60 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      isIncluded ? 'bg-teal-500/20 text-teal-300' : 'bg-zinc-800 text-zinc-300'
                                    }`}>
                                      {getFormatStr(dup)} Variant
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-medium">
                                      {group.similarity}% match
                                    </span>
                                  </div>

                                  <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox(group.allFiles, dIdx + 1)}>
                                    <MediaThumbnail item={dup} showFilename={false} />
                                  </div>

                                  <div className="space-y-1 text-[11px] text-zinc-400 pt-1">
                                    <p className="font-semibold text-white truncate" title={dup.originalFilename || dup.filename}>
                                      {dup.originalFilename || dup.filename}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-400 font-mono">
                                      <span>{getFormatStr(dup)} • {formatBytes(dup.fileBlob?.size || dup.fileSize || dup.size)}</span>
                                      <span className="text-right">{getDimensionsStr(dup) || 'Original'}</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSetCanonical('formatVariants', group.id, dup)}
                                      className="py-1 px-2 rounded bg-white/5 hover:bg-teal-400 hover:text-zinc-950 text-zinc-300 text-[10px] font-bold transition-colors text-center truncate"
                                      title="Set this format variant as the best version"
                                    >
                                      Choose Version
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDuplicateInclusion(dup)}
                                      className={`py-1 px-2 rounded text-[10px] font-bold transition-colors text-center truncate ${
                                        isIncluded
                                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                                      }`}
                                    >
                                      {isIncluded ? 'Exclude' : 'Keep'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: EXACT DUPLICATES */}
              {duplicateGroups.exact?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Copy size={15} className="text-purple-400" />
                      Exact Duplicates ({duplicateGroups.exact.length} {duplicateGroups.exact.length === 1 ? 'group' : 'groups'} • {exactCount} copies filtered)
                    </h3>
                    <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      100% SHA-256 Byte Match
                    </span>
                  </div>

                  <div className="space-y-4">
                    {duplicateGroups.exact.map((group) => {
                      const allCopiesKept = group.duplicates.every((d) => isItemIncluded(d.id));
                      return (
                        <div key={group.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{group.reason}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  1 Canonical Pick
                                </span>
                              </div>
                              <span className="text-xs text-zinc-400 mt-0.5 block">
                                {group.duplicates.length} duplicate {group.duplicates.length === 1 ? 'copy' : 'copies'} excluded from memory presentation
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleKeepRecommended(group)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                              >
                                Keep Recommended
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKeepAllDuplicates(group)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  allCopiesKept
                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                                }`}
                              >
                                {allCopiesKept ? 'All Copies Included' : 'Keep All Copies'}
                              </button>
                            </div>
                          </div>

                          {/* Side-by-Side Comparison Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Canonical Primary Representative */}
                            <div className="p-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/[0.04] space-y-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-wide">
                                  Primary Pick
                                </span>
                                <span className="text-[10px] font-medium text-emerald-400">
                                  {group.canonical.isInExistingLibrary ? 'In Vault' : 'New Upload'}
                                </span>
                              </div>

                              <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox(group.allFiles, 0)}>
                                <MediaThumbnail item={group.canonical} showFilename={false} />
                              </div>

                              <div className="space-y-1 text-[11px] text-zinc-400 pt-1">
                                <p className="font-semibold text-white truncate" title={group.canonical.originalFilename || group.canonical.filename}>
                                  {group.canonical.originalFilename || group.canonical.filename}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500 font-mono">
                                  <span>{getFormatStr(group.canonical)} • {formatBytes(group.canonical.fileBlob?.size || group.canonical.fileSize || group.canonical.size)}</span>
                                  <span className="text-right">{getDimensionsStr(group.canonical) || 'Original'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Duplicate Copies */}
                            {group.duplicates.map((dup, dIdx) => {
                              const isIncluded = isItemIncluded(dup.id);
                              return (
                                <div
                                  key={dup.id}
                                  className={`p-3 rounded-xl border space-y-2 transition-all relative ${
                                    isIncluded
                                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                                      : 'border-white/10 bg-zinc-900/60 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      isIncluded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}>
                                      {isIncluded ? 'Restored to Memory' : 'Duplicate Copy'}
                                    </span>
                                    <span className="text-[10px] font-medium text-zinc-500">
                                      {dup.isInExistingLibrary ? 'In Vault' : 'New Upload'}
                                    </span>
                                  </div>

                                  <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox(group.allFiles, dIdx + 1)}>
                                    <MediaThumbnail item={dup} showFilename={false} />
                                  </div>

                                  <div className="space-y-1 text-[11px] text-zinc-400 pt-1">
                                    <p className="font-semibold text-white truncate" title={dup.originalFilename || dup.filename}>
                                      {dup.originalFilename || dup.filename}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500 font-mono">
                                      <span>{getFormatStr(dup)} • {formatBytes(dup.fileBlob?.size || dup.fileSize || dup.size)}</span>
                                      <span className="text-right">{getDimensionsStr(dup) || 'Original'}</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSetCanonical('exact', group.id, dup)}
                                      className="py-1 px-2 rounded bg-white/5 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 text-[10px] font-bold transition-colors text-center truncate"
                                      title="Set this duplicate as primary representative"
                                    >
                                      Make Primary
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDuplicateInclusion(dup)}
                                      className={`py-1 px-2 rounded text-[10px] font-bold transition-colors text-center truncate ${
                                        isIncluded
                                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                                      }`}
                                    >
                                      {isIncluded ? 'Exclude' : 'Include'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: BURST SEQUENCES */}
              {burstGroups.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap size={15} className="text-amber-400" />
                      Burst Sequences ({burstGroups.length} {burstGroups.length === 1 ? 'sequence' : 'sequences'})
                    </h3>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Rapid Shutter Shots
                    </span>
                  </div>

                  <div className="space-y-4">
                    {burstGroups.map((burst) => {
                      const allBurstKept = burst.allFiles.every((f) => isItemIncluded(f.id));
                      return (
                        <div key={burst.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-amber-500/20 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{burst.sequenceLabel || burst.reason}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Top {burst.recommended.length} Sharpest Frames Recommended
                                </span>
                              </div>
                              <span className="text-xs text-zinc-400 mt-0.5 block">
                                {burst.allFiles.length} photos captured in rapid sequence ({burst.timeSpanSeconds > 0 ? `${burst.timeSpanSeconds}s span` : 'rapid fire'}). Curated to avoid redundant poses.
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleKeepRecommendedBurst(burst)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-white transition-colors"
                              >
                                Keep Recommended
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenLightbox(burst.allFiles, 0)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                              >
                                <Eye size={12} />
                                Review All
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKeepAllBurstFrames(burst.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  allBurstKept
                                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                                }`}
                              >
                                {allBurstKept ? 'All Frames Included' : 'Keep All'}
                              </button>
                            </div>
                          </div>

                          {/* Burst Frames Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {burst.allFiles.map((file, fIdx) => {
                              const isRec = burst.recommended.some((r) => r.id === file.id);
                              const isIncluded = isItemIncluded(file.id);
                              const captureTime = formatTimeStr(file);
                              return (
                                <div
                                  key={file.id}
                                  className={`p-2 rounded-xl border space-y-2 transition-all relative ${
                                    isRec
                                      ? 'border-amber-500/50 bg-amber-500/[0.04]'
                                      : (isIncluded ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-white/10 bg-zinc-900/60 opacity-70 hover:opacity-100')
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    {isRec ? (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 text-[9px] font-black uppercase flex items-center gap-1">
                                        <Award size={9} /> Top Pick
                                      </span>
                                    ) : (
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                        isIncluded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                                      }`}>
                                        {isIncluded ? 'Included' : 'Frame'}
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono text-zinc-500">#{fIdx + 1}</span>
                                  </div>

                                  <div
                                    className="aspect-square rounded-lg overflow-hidden relative cursor-pointer"
                                    onClick={() => handleOpenLightbox(burst.allFiles, fIdx)}
                                  >
                                    <MediaThumbnail item={file} showFilename={false} />
                                  </div>

                                  <div className="text-[10px] text-zinc-400 space-y-0.5">
                                    <p className="font-semibold text-white truncate" title={file.originalFilename || file.filename}>
                                      {file.originalFilename || file.filename}
                                    </p>
                                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                                      <span>{getFormatStr(file)}</span>
                                      <span>{captureTime || formatBytes(file.fileBlob?.size || file.fileSize || file.size)}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleBurstFrame(burst.id, file)}
                                    className={`w-full py-1 px-1.5 rounded text-[10px] font-bold transition-colors text-center ${
                                      isIncluded
                                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                                    }`}
                                  >
                                    {isIncluded ? 'Exclude' : 'Include'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 4: VISUAL NEAR-DUPLICATES */}
              {duplicateGroups.near?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers size={15} className="text-indigo-400" />
                      Visual Near-Duplicates ({duplicateGroups.near.length} {duplicateGroups.near.length === 1 ? 'group' : 'groups'} • {nearCount} variations)
                    </h3>
                    <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                      Perceptual Hash & SSIM Verified
                    </span>
                  </div>

                  <div className="space-y-4">
                    {duplicateGroups.near.map((group) => {
                      const allCopiesKept = group.duplicates.every((d) => isItemIncluded(d.id));
                      return (
                        <div key={group.id} className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{group.reason}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {group.similarity}% Visual Match
                                </span>
                              </div>
                              <span className="text-xs text-zinc-400 mt-0.5 block">
                                Highest resolution / sharpest representation chosen as canonical pick.
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleKeepRecommended(group)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                              >
                                Keep Recommended
                              </button>
                              <button
                                type="button"
                                onClick={() => handleKeepAllDuplicates(group)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  allCopiesKept
                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
                                }`}
                              >
                                {allCopiesKept ? 'All Copies Included' : 'Keep All Copies'}
                              </button>
                            </div>
                          </div>

                          {/* Side-by-Side Comparison Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {/* Canonical Representative */}
                            <div className="p-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/[0.04] space-y-2 relative">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[10px] font-black uppercase tracking-wide">
                                  Primary Pick
                                </span>
                                <span className="text-[10px] font-medium text-emerald-400">
                                  {group.canonical.isInExistingLibrary ? 'In Vault' : 'New Upload'}
                                </span>
                              </div>

                              <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox(group.allFiles, 0)}>
                                <MediaThumbnail item={group.canonical} showFilename={false} />
                              </div>

                              <div className="space-y-1 text-[11px] text-zinc-400 pt-1">
                                <p className="font-semibold text-white truncate" title={group.canonical.originalFilename || group.canonical.filename}>
                                  {group.canonical.originalFilename || group.canonical.filename}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500 font-mono">
                                  <span>{getFormatStr(group.canonical)} • {formatBytes(group.canonical.fileBlob?.size || group.canonical.fileSize || group.canonical.size)}</span>
                                  <span className="text-right">{getDimensionsStr(group.canonical) || 'Original'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Near-Duplicate Copies */}
                            {group.duplicates.map((dup, dIdx) => {
                              const isIncluded = isItemIncluded(dup.id);
                              return (
                                <div
                                  key={dup.id}
                                  className={`p-3 rounded-xl border space-y-2 transition-all relative ${
                                    isIncluded
                                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                                      : 'border-white/10 bg-zinc-900/60 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      isIncluded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    }`}>
                                      {isIncluded ? 'Restored to Memory' : 'Visual Duplicate'}
                                    </span>
                                    <span className="text-[10px] font-medium text-zinc-500">
                                      {dup.isInExistingLibrary ? 'In Vault' : 'New Upload'}
                                    </span>
                                  </div>

                                  <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => handleOpenLightbox(group.allFiles, dIdx + 1)}>
                                    <MediaThumbnail item={dup} showFilename={false} />
                                  </div>

                                  <div className="space-y-1 text-[11px] text-zinc-400 pt-1">
                                    <p className="font-semibold text-white truncate" title={dup.originalFilename || dup.filename}>
                                      {dup.originalFilename || dup.filename}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500 font-mono">
                                      <span>{getFormatStr(dup)} • {formatBytes(dup.fileBlob?.size || dup.fileSize || dup.size)}</span>
                                      <span className="text-right">{getDimensionsStr(dup) || 'Original'}</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSetCanonical('near', group.id, dup)}
                                      className="py-1 px-2 rounded bg-white/5 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 text-[10px] font-bold transition-colors text-center truncate"
                                      title="Set this image as primary representative"
                                    >
                                      Make Primary
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDuplicateInclusion(dup)}
                                      className={`py-1 px-2 rounded text-[10px] font-bold transition-colors text-center truncate ${
                                        isIncluded
                                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                                      }`}
                                    >
                                      {isIncluded ? 'Exclude' : 'Include'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {(!duplicateGroups.exact || duplicateGroups.exact.length === 0) &&
                (!duplicateGroups.formatVariants || duplicateGroups.formatVariants.length === 0) &&
                (!duplicateGroups.near || duplicateGroups.near.length === 0) &&
                (!burstGroups || burstGroups.length === 0) && (
                  <div className="py-16 text-center text-zinc-500 space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500/50" />
                    <p className="text-sm font-semibold text-zinc-400">No duplicates or burst sequences detected</p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      All uploaded media items are visually distinct and ready to be organized into memories.
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: ARCHIVE & DOCUMENTS                                     */}
          {/* ============================================================== */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-3">
                <Archive size={16} className="text-zinc-400 shrink-0" />
                <span>
                  Documents, tickets, receipts, and digital screenshots are classified as archive materials. They won't clutter your streaming memories, but remain permanently accessible in your vault.
                </span>
              </div>

              {archiveFiles.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <p className="text-sm">No documents, tickets, or receipts detected.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {archiveFiles.map((file) => (
                    <div key={file.id} className="p-2.5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-2 flex flex-col justify-between">
                      <MediaThumbnail item={file} showFilename={true} />
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono block truncate">
                          {file.classification?.reason || 'Document / Archive'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePromoteArchiveFile(file)}
                          className="w-full py-1 text-[10px] font-bold bg-white/5 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 rounded transition-colors"
                        >
                          Promote to Memory
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: UNORGANIZED                                             */}
          {/* ============================================================== */}
          {activeTab === 'unorganized' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-xs text-zinc-300 flex items-center gap-3">
                <Inbox size={16} className="text-zinc-400 shrink-0" />
                <span>
                  These files lacked sufficient metadata or visual grouping evidence to form a confident memory. They remain safely stored in your vault.
                </span>
              </div>

              {unorganized.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <p className="text-sm">All uploaded files were successfully organized into memories or archive collections.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {unorganized.map((file, idx) => (
                    <div key={file.id} className="relative group/unorg bg-zinc-900/40 p-2 rounded-xl border border-white/[0.06]">
                      <MediaThumbnail
                        item={file}
                        onClick={() => handleOpenLightbox(unorganized, idx)}
                        showFilename={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* ============================================================== */}
        {/* ZONE 5: FIXED MODAL FOOTER CONTROLS                             */}
        {/* ============================================================== */}
        <footer className="sticky bottom-0 z-30 shrink-0 bg-[#0d0d12]/95 backdrop-blur-md border-t border-white/[0.08] px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            <span className="font-bold text-white">{newGroups.length} memories</span> ready to create • <span className="font-bold text-emerald-400">{recommendedCount} recommended media</span> items
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={isApplying || (newGroups.length === 0 && matches.length === 0)}
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-lg shadow-emerald-500/15 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Creating Memories...
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} />
                  Approve & Create Memories
                </>
              )}
            </button>
          </div>
        </footer>

      </motion.div>
    </div>
  );
}
