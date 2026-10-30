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

  // Overview counts
  const overview = analysisResults.overview || {};
  const totalAnalyzed = overview.totalAnalyzed || 0;
  const recommendedCount = overview.recommendedCount || 0;
  const reviewCount = overview.reviewCount || 0;
  const duplicateCount = overview.exactDuplicateCount + overview.nearDuplicateCount || 0;
  const burstCount = overview.burstCount || 0;

  // Open lightbox
  const handleOpenLightbox = (itemList, index = 0) => {
    setLightboxItems(itemList);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
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
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                <Info size={16} className="text-purple-400 shrink-0" />
                <span>
                  Duplicates and rapid camera bursts are automatically filtered so your memories remain clean and diverse. Original files always remain in your archive.
                </span>
              </div>

              {/* Exact Duplicates */}
              {duplicateGroups.exact?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Copy size={16} className="text-purple-400" />
                    Exact Duplicates ({duplicateGroups.exact.length} pairs):
                  </h3>

                  <div className="space-y-3">
                    {duplicateGroups.exact.map((group) => (
                      <div key={group.id} className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{group.reason}</span>
                          <span className="text-emerald-400 font-bold">1 Recommended Representative</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          <div className="relative border-2 border-emerald-400 rounded-xl overflow-hidden p-1 bg-black">
                            <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[9px] font-black uppercase">
                              Primary
                            </span>
                            <MediaThumbnail item={group.canonical} showFilename={true} />
                          </div>

                          {group.duplicates.map((dup) => (
                            <div key={dup.id} className="relative opacity-60 hover:opacity-100 transition-opacity">
                              <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-red-500/90 text-white text-[9px] font-black uppercase">
                                Duplicate Copy
                              </span>
                              <MediaThumbnail item={dup} showFilename={true} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Burst Sequences */}
              {burstGroups.length > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap size={16} className="text-blue-400" />
                    Burst Sequences ({burstGroups.length} sequences):
                  </h3>

                  <div className="space-y-3">
                    {burstGroups.map((burst) => (
                      <div key={burst.id} className="p-4 rounded-xl bg-zinc-900 border border-white/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-white">{burst.reason}</span>
                          <span className="text-amber-400 text-[11px] font-bold">Top {burst.recommended.length} frames recommended</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {burst.allFiles.map((file) => {
                            const isRec = burst.recommended.some(r => r.id === file.id);
                            return (
                              <div key={file.id} className={`relative rounded-xl overflow-hidden ${isRec ? 'border-2 border-amber-400 p-0.5' : 'opacity-70'}`}>
                                {isRec && (
                                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 text-[9px] font-black uppercase flex items-center gap-1">
                                    <Award size={10} /> Top Pick
                                  </span>
                                )}
                                <MediaThumbnail item={file} showFilename={true} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {duplicateGroups.exact?.length === 0 && burstGroups.length === 0 && (
                <div className="py-12 text-center text-zinc-500">
                  <p>No duplicates or burst sequences detected in this batch.</p>
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
