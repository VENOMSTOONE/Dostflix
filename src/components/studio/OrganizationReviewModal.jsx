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
  if (item?.filename) {
    const parts = item.filename.split('.');
    if (parts.length > 1) return parts[parts.length - 1].toUpperCase();
  }
  return '';
};

export default function OrganizationReviewModal({
  isOpen = false,
  analysisResults = { 
    matchExisting: [], 
    suggestedNew: [], 
    archiveGroup: { files: [] }, 
    duplicateGroup: { exact: [], near: [], totalCount: 0 },
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
  const [duplicateGroups, setDuplicateGroups] = useState(() => analysisResults.duplicateGroup || { exact: [], near: [] });
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
      setDuplicateGroups(analysisResults.duplicateGroup || { exact: [], near: [] });
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
  const nearCount = duplicateGroups.near?.reduce((acc, g) => acc + (g.duplicates?.length || 0), 0) || 0;
  const duplicateCount = exactCount + nearCount;
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

  // Switch canonical representative in duplicate group
  const handleSetCanonical = (groupType, groupId, newCanonical) => {
    soundFx.playPop();
    const listKey = groupType === 'exact' ? 'exact' : 'near';
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

  // Toggle individual burst frame inclusion
  const handleToggleBurstFrame = (burstId, file) => {
    soundFx.playClick();
    const isCurrentlyRec = isItemIncluded(file.id);
    const newCategory = isCurrentlyRec ? 'EXCLUDED' : 'KEEP';

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
                reason: newCategory === 'KEEP' ? 'User included burst frame.' : 'User excluded burst frame.',
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

  // Keep all frames in a burst sequence
  const handleKeepAllBurstFrames = (burstId) => {
    soundFx.playPop();
    const burst = burstGroups.find((b) => b.id === burstId);
    if (!burst) return;

    setBurstGroups((prev) =>
      prev.map((b) => (b.id === burstId ? { ...b, recommended: b.allFiles, secondary: [] } : b))
    );

    // Update all burst photos in newGroups to KEEP
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
                reason: 'User approved all frames from burst sequence.',
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

  // Toggle group expansion
  const toggleExpand = (id) => {
    soundFx.playClick();
    setExpandedGroupId(prev => prev === id ? null : id);
  };

  // Title editing
  const handleStartRename = (group) => {
    setEditingGroupId(group.id);
    setTempTitle(group.suggestedTitle);
  };

  const handleSaveRename = (groupId) => {
    setNewGroups(prev => prev.map(g => g.id === groupId ? { ...g, suggestedTitle: tempTitle.trim() || g.suggestedTitle } : g));
    setEditingGroupId(null);
  };

  // Change Cover Photo
  const handleSelectCover = (groupId, fileId) => {
    soundFx.playPop();
    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, selectedCoverId: fileId };
      }
      return g;
    }));
  };

  // Toggle Item Curation Category inside a group
  const handleChangeItemCategory = (groupId, fileId, newCategory) => {
    soundFx.playClick();
    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const updatedFiles = g.files.map(f => {
          if (f.id === fileId) {
            return {
              ...f,
              classification: {
                ...f.classification,
                category: newCategory,
                badgeColor: newCategory === 'KEEP' ? 'green' : (newCategory === 'REVIEW' ? 'yellow' : (newCategory === 'ARCHIVE' ? 'grey' : 'red')),
                badgeLabel: newCategory === 'KEEP' ? 'Recommended' : (newCategory === 'REVIEW' ? 'Needs Review' : (newCategory === 'ARCHIVE' ? 'Archive Only' : 'Excluded')),
                reason: `User manually classified as ${newCategory}.`,
              }
            };
          }
          return f;
        });

        // Recalculate recommendedFiles
        const recommendedFiles = updatedFiles.filter(f => f.classification?.category === 'KEEP');
        const reviewFiles = updatedFiles.filter(f => f.classification?.category === 'REVIEW');
        return { ...g, files: updatedFiles, recommendedFiles, reviewFiles };
      }
      return g;
    }));
  };

  // Remove file from group and move to unorganized
  const handleRemoveFileFromGroup = (groupId, fileId) => {
    soundFx.playPop();
    const group = newGroups.find(g => g.id === groupId);
    if (!group) return;
    const fileToMove = group.files.find(f => f.id === fileId);
    if (!fileToMove) return;

    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { 
          ...g, 
          files: g.files.filter(f => f.id !== fileId),
          recommendedFiles: g.recommendedFiles?.filter(f => f.id !== fileId) || []
        };
      }
      return g;
    }).filter(g => g.files.length > 0));

    setUnorganized(prev => [fileToMove, ...prev]);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      
      {/* Lightbox for inspecting high-res details */}
      <MediaLightbox
        isOpen={isLightboxOpen}
        items={lightboxItems}
        initialIndex={lightboxIndex}
        onClose={() => setIsLightboxOpen(false)}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-zinc-950/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-white/10 bg-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center text-emerald-400 shadow-lg">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Intelligent Memory Curation
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Vision Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Analyzed visual content, filtered duplicates, and curated the best memories for your collection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Curation Overview Metric Bar */}
        <div className="px-6 py-3.5 bg-zinc-950 border-b border-white/5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Analyzed</span>
            <span className="text-base font-bold text-white mt-0.5">{totalAnalyzed} files</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col">
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Recommended
            </span>
            <span className="text-base font-bold text-emerald-300 mt-0.5">{recommendedCount} items</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col">
            <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Needs Review
            </span>
            <span className="text-base font-bold text-amber-300 mt-0.5">{reviewCount} items</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 flex flex-col">
            <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Copy size={10} /> Duplicates
            </span>
            <span className="text-base font-bold text-purple-300 mt-0.5">{duplicateCount} files</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col">
            <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Zap size={10} /> Bursts
            </span>
            <span className="text-base font-bold text-blue-300 mt-0.5">{burstCount} sets</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-800/20 border border-white/5 flex flex-col">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Archive size={10} /> Archive
            </span>
            <span className="text-base font-bold text-zinc-300 mt-0.5">{archiveFiles.length} files</span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 border-b border-white/10 bg-zinc-900/30 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('memories')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'memories'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            Suggested Memories ({newGroups.length + matches.length})
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('duplicates')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'duplicates'
                ? 'border-purple-400 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Copy size={14} />
            Duplicates & Bursts ({duplicateCount + burstCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'archive'
                ? 'border-zinc-400 text-zinc-200 bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Archive size={14} />
            Archive & Documents ({archiveFiles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unorganized')}
            className={`px-4 py-3 text-xs font-bold tracking-wide uppercase border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'unorganized'
                ? 'border-zinc-400 text-zinc-200 bg-white/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Inbox size={14} />
            Unorganized ({unorganized.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">

          {/* ============================================================== */}
          {/* TAB 1: SUGGESTED MEMORIES                                      */}
          {/* ============================================================== */}
          {activeTab === 'memories' && (
            <div className="space-y-6">
              
              {/* Quick Accept High Confidence Banner */}
              {(matches.some(m => m.confidenceLevel === 'high') || newGroups.some(g => g.confidenceLevel === 'high')) && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">High Confidence Memories Ready</p>
                      <p className="text-[11px] text-zinc-400">Multiple verified signals (EXIF dates, GPS, visual similarity) matched with certainty.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAcceptHighConfidence}
                    disabled={isApplying}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Check size={14} strokeWidth={3} />
                    Accept High Confidence
                  </button>
                </div>
              )}

              {newGroups.length === 0 && matches.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 flex flex-col items-center">
                  <Inbox size={48} className="text-zinc-600 mb-3" />
                  <p className="text-sm font-semibold text-zinc-400">No memory groupings available</p>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1">All uploaded files were either classified as documents, duplicates, or placed in unorganized storage.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* New Group Suggestions */}
                  {newGroups.map((group) => {
                    const isExpanded = expandedGroupId === group.id;
                    const isEditing = editingGroupId === group.id;
                    const activeCover = group.coverCandidates?.find(c => c.file.id === group.selectedCoverId)?.file || group.files[0];

                    // Filtered files for this group
                    const displayedFiles = groupFilter === 'all'
                      ? group.files
                      : (groupFilter === 'recommended'
                        ? group.files.filter(f => f.classification?.category === 'KEEP')
                        : (groupFilter === 'review'
                          ? group.files.filter(f => f.classification?.category === 'REVIEW')
                          : group.files.filter(f => f.classification?.category === 'EXCLUDE')));

                    return (
                      <div 
                        key={group.id} 
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'bg-zinc-900/90 border-emerald-500/40 shadow-xl' 
                            : 'bg-zinc-900/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Group Header Card */}
                        <div 
                          onClick={() => toggleExpand(group.id)}
                          className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-start sm:items-center gap-4">
                            {/* Mini Cover Preview */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/15 bg-zinc-950 shrink-0 shadow-md">
                              <img 
                                src={activeCover?.previewUrl || activeCover?.thumbnail} 
                                alt={group.suggestedTitle} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 right-1 p-0.5 rounded bg-black/75 text-amber-300">
                                <Award size={10} />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isEditing ? (
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="text"
                                      value={tempTitle}
                                      onChange={e => setTempTitle(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(group.id); }}
                                      className="px-2.5 py-1 text-sm bg-zinc-950 border border-emerald-400 rounded-lg text-white outline-none focus:ring-1 focus:ring-emerald-400"
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
                                    <h3 className="text-base sm:text-lg font-black text-white truncate">
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
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                  group.confidenceLevel === 'high'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : (group.confidenceLevel === 'medium'
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-400')
                                }`}>
                                  {group.confidence}
                                </span>
                              </div>

                              {/* Metadata Badges */}
                              <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                                {group.suggestedDate ? (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} className={group.dateStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'} />
                                    <span>{new Date(group.suggestedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className="text-[9px] text-zinc-500">({group.dateStatus})</span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Date Unknown</span>
                                )}

                                {group.suggestedLocation ? (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className={group.locationStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'} />
                                    <span>{group.suggestedLocation}</span>
                                    <span className="text-[9px] text-zinc-500">({group.locationStatus})</span>
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Location Unknown</span>
                                )}

                                <span className="text-zinc-500">•</span>
                                <span className="font-semibold text-emerald-400">
                                  {group.recommendedFiles?.length || group.files.length} Recommended
                                </span>
                                {group.reviewFiles?.length > 0 && (
                                  <span className="text-amber-400 font-medium">
                                    ({group.reviewFiles.length} to review)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end lg:self-center">
                            <span className="text-xs text-zinc-400 font-medium">
                              {isExpanded ? 'Collapse' : 'Review & Curate'}
                            </span>
                            <div className={`p-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
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
                              className="border-t border-white/10 p-5 sm:p-6 bg-zinc-950/60 space-y-6"
                            >
                              {/* Rationale Signals */}
                              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                                  Analysis Evidence & Grouping Rationale:
                                </span>
                                <ul className="text-xs text-zinc-300 space-y-1">
                                  {group.reasons?.map((r, rIdx) => (
                                    <li key={rIdx} className="flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Phase 10: Recommended Cover Photographs */}
                              {group.coverCandidates && group.coverCandidates.length > 0 && (
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                      <Award size={14} className="text-amber-400" />
                                      Recommended Cinematic Cover Candidates:
                                    </span>
                                    <span className="text-[11px] text-zinc-400">Click any photo to make it the hero cover</span>
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
                                              ? 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400/50' 
                                              : 'bg-zinc-900 border-white/10 hover:border-white/25'
                                          }`}
                                        >
                                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black">
                                            <img src={cand.file.previewUrl || cand.file.thumbnail} alt="Cover candidate" className="w-full h-full object-cover" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1">
                                              <span className="text-[11px] font-bold text-white truncate">Option {cIdx + 1}</span>
                                              {isChosen && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-400 text-zinc-950 rounded">Selected</span>}
                                            </div>
                                            <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2">{cand.reason}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Media Curation Grid & Tier Filter */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    Curate Media Selection ({group.files.length} items):
                                  </span>

                                  {/* Filter Pills */}
                                  <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-white/10 text-xs">
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
                                      <div key={file.id} className="relative group/card flex flex-col">
                                        <MediaThumbnail
                                          item={file}
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

                                        {/* Reason & Action Panel */}
                                        <div className="mt-1.5 space-y-1">
                                          <p className="text-[10px] text-zinc-400 line-clamp-1" title={file.classification?.reason}>
                                            {file.classification?.reason || file.originalFilename}
                                          </p>

                                          {/* Quick Curation Tier Toggles */}
                                          <div className="flex items-center gap-1 text-[9px]">
                                            <button
                                              type="button"
                                              onClick={() => handleChangeItemCategory(group.id, file.id, 'KEEP')}
                                              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${cat === 'KEEP' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-emerald-300'}`}
                                            >
                                              Keep
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleChangeItemCategory(group.id, file.id, 'REVIEW')}
                                              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${cat === 'REVIEW' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-amber-300'}`}
                                            >
                                              Review
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleChangeItemCategory(group.id, file.id, 'EXCLUDE')}
                                              className={`px-1.5 py-0.5 rounded font-bold transition-colors ${cat === 'EXCLUDE' ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-red-300'}`}
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
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                    <Copy size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Intelligent Duplicate & Burst Curation</span>
                    <span>
                      Exact duplicates, visual near-duplicates, and rapid camera bursts are automatically filtered so your memories remain clean and diverse. Original files always remain safe in your vault.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: EXACT DUPLICATES */}
              {duplicateGroups.exact?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Copy size={16} className="text-purple-400" />
                      Exact Duplicates ({duplicateGroups.exact.length} {duplicateGroups.exact.length === 1 ? 'group' : 'groups'} • {exactCount} copies filtered):
                    </h3>
                    <span className="text-[11px] font-semibold text-purple-400/80 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                      100% SHA-256 Byte Match
                    </span>
                  </div>

                  <div className="space-y-4">
                    {duplicateGroups.exact.map((group) => {
                      const allCopiesKept = group.duplicates.every((d) => isItemIncluded(d.id));
                      return (
                        <div key={group.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
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
                                <p className="font-semibold text-white truncate" title={group.canonical.filename}>
                                  {group.canonical.filename}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500">
                                  <span>{getFormatStr(group.canonical)} • {formatBytes(group.canonical.fileBlob?.size || group.canonical.size)}</span>
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
                                    <p className="font-semibold text-white truncate" title={dup.filename}>
                                      {dup.filename}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500">
                                      <span>{getFormatStr(dup)} • {formatBytes(dup.fileBlob?.size || dup.size)}</span>
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

              {/* SECTION 2: VISUAL NEAR-DUPLICATES */}
              {duplicateGroups.near?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers size={16} className="text-indigo-400" />
                      Visual Near-Duplicates ({duplicateGroups.near.length} {duplicateGroups.near.length === 1 ? 'group' : 'groups'} • {nearCount} variations):
                    </h3>
                    <span className="text-[11px] font-semibold text-indigo-400/80 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      Perceptual Hash & SSIM Verified
                    </span>
                  </div>

                  <div className="space-y-4">
                    {duplicateGroups.near.map((group) => {
                      const allCopiesKept = group.duplicates.every((d) => isItemIncluded(d.id));
                      return (
                        <div key={group.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
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
                                <p className="font-semibold text-white truncate" title={group.canonical.filename}>
                                  {group.canonical.filename}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500">
                                  <span>{getFormatStr(group.canonical)} • {formatBytes(group.canonical.fileBlob?.size || group.canonical.size)}</span>
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
                                    <p className="font-semibold text-white truncate" title={dup.filename}>
                                      {dup.filename}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-2 text-[10px] text-zinc-500">
                                      <span>{getFormatStr(dup)} • {formatBytes(dup.fileBlob?.size || dup.size)}</span>
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

              {/* SECTION 3: BURST SEQUENCES */}
              {burstGroups.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" />
                      Burst Sequences ({burstGroups.length} {burstGroups.length === 1 ? 'sequence' : 'sequences'}):
                    </h3>
                    <span className="text-[11px] font-semibold text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      Rapid Shutter Shots
                    </span>
                  </div>

                  <div className="space-y-4">
                    {burstGroups.map((burst) => {
                      const allBurstKept = burst.allFiles.every((f) => isItemIncluded(f.id));
                      return (
                        <div key={burst.id} className="p-5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{burst.reason}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Top {burst.recommended.length} Sharpest Frames Recommended
                                </span>
                              </div>
                              <span className="text-xs text-zinc-400 mt-0.5 block">
                                Captured in rapid succession ({burst.timespanSeconds}s window). Curated to avoid redundant poses.
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleKeepRecommendedBurst(burst)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                              >
                                Keep Top Picks
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
                                {allBurstKept ? 'All Frames Included' : 'Keep All Frames'}
                              </button>
                            </div>
                          </div>

                          {/* Burst Frames Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {burst.allFiles.map((file, fIdx) => {
                              const isRec = burst.recommended.some((r) => r.id === file.id);
                              const isIncluded = isItemIncluded(file.id);
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
                                    <p className="font-semibold text-white truncate" title={file.filename}>
                                      {file.filename}
                                    </p>
                                    <div className="flex items-center justify-between text-[9px] text-zinc-500">
                                      <span>{getFormatStr(file)}</span>
                                      <span>{formatBytes(file.fileBlob?.size || file.size)}</span>
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

              {/* EMPTY STATE */}
              {(!duplicateGroups.exact || duplicateGroups.exact.length === 0) &&
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
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 flex items-center gap-2">
                <Archive size={16} className="text-zinc-400 shrink-0" />
                <span>
                  Documents, tickets, receipts, and digital screenshots are classified as archive materials. They won't clutter your streaming memories, but remain permanently accessible in your vault.
                </span>
              </div>

              {archiveFiles.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <p>No documents, tickets, or receipts detected.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {archiveFiles.map((file) => (
                    <div key={file.id} className="p-2 rounded-xl bg-zinc-900 border border-white/10 space-y-2 flex flex-col justify-between">
                      <MediaThumbnail item={file} showFilename={true} />
                      <div className="space-y-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-bold block truncate">
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
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 flex items-center gap-2">
                <Inbox size={16} className="text-zinc-400 shrink-0" />
                <span>
                  These files lacked sufficient metadata or visual grouping evidence to form a confident memory. They remain safely stored in your vault.
                </span>
              </div>

              {unorganized.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <p>All uploaded files were successfully organized into memories or archive collections.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {unorganized.map((file, idx) => (
                    <div key={file.id} className="relative group/unorg">
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

        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-white/10 bg-zinc-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            <span className="font-bold text-white">{newGroups.length} memories</span> ready to create • <span className="font-bold text-emerald-400">{recommendedCount} recommended media</span> items
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={isApplying || (newGroups.length === 0 && matches.length === 0)}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
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
        </div>

      </motion.div>
    </div>
  );
}
