import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  FolderPlus, 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  Edit2,
  CheckCircle2,
  Inbox,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';
import MediaThumbnail from './MediaThumbnail';
import MediaLightbox from './MediaLightbox';

export default function OrganizationReviewModal({
  isOpen = false,
  analysisResults = { matchExisting: [], suggestedNew: [], unorganized: [] },
  onClose,
  onApplyMatches,
  onCreateSuggestedMemories,
  onKeepInInbox,
}) {
  const { currentTheme } = useTheme();

  // Local editable state of suggestions so the user can tweak before applying
  const [matches, setMatches] = useState(() => analysisResults.matchExisting || []);
  const [newGroups, setNewGroups] = useState(() => analysisResults.suggestedNew || []);
  const [unorganized, setUnorganized] = useState(() => analysisResults.unorganized || []);

  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Lightbox state
  const [lightboxItems, setLightboxItems] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sync state if analysisResults changes
  useEffect(() => {
    if (analysisResults) {
      setMatches(analysisResults.matchExisting || []);
      setNewGroups(analysisResults.suggestedNew || []);
      setUnorganized(analysisResults.unorganized || []);
    }
  }, [analysisResults]);

  // Lock body scroll while modal is open
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
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLightboxOpen, onClose]);

  if (!isOpen) return null;

  // Open lightbox for a given item list
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

  // Start editing a group's title
  const handleStartRename = (group) => {
    setEditingGroupId(group.id);
    setTempTitle(group.suggestedTitle);
  };

  const handleSaveRename = (groupId) => {
    setNewGroups(prev => prev.map(g => g.id === groupId ? { ...g, suggestedTitle: tempTitle.trim() || g.suggestedTitle } : g));
    setEditingGroupId(null);
  };

  // Remove a file from a suggested group and move it to unorganized
  const handleRemoveFileFromGroup = (groupId, fileId) => {
    soundFx.playPop();
    const group = newGroups.find(g => g.id === groupId);
    if (!group) return;

    const fileToMove = group.files.find(f => f.id === fileId);
    if (!fileToMove) return;

    setNewGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, files: g.files.filter(f => f.id !== fileId) };
      }
      return g;
    }).filter(g => g.files.length > 0)); // Remove empty group

    setUnorganized(prev => [fileToMove, ...prev]);
  };

  // Remove a file from an existing memory match
  const handleRemoveFileFromMatch = (matchId, fileId) => {
    soundFx.playPop();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const fileToMove = match.files.find(f => f.id === fileId);
    if (!fileToMove) return;

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, files: m.files.filter(f => f.id !== fileId) };
      }
      return m;
    }).filter(m => m.files.length > 0));

    setUnorganized(prev => [fileToMove, ...prev]);
  };

  // Dismiss a match suggestion (moves all its files to unorganized)
  const handleDismissMatch = (matchId) => {
    soundFx.playPop();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setMatches(prev => prev.filter(m => m.id !== matchId));
    setUnorganized(prev => [...match.files, ...prev]);
  };

  // Dismiss a new group suggestion (moves all its files to unorganized)
  const handleDismissNewGroup = (groupId) => {
    soundFx.playPop();
    const group = newGroups.find(g => g.id === groupId);
    if (!group) return;

    setNewGroups(prev => prev.filter(g => g.id !== groupId));
    setUnorganized(prev => [...group.files, ...prev]);
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

  const totalFilesToOrganize = 
    matches.reduce((acc, m) => acc + m.files.length, 0) +
    newGroups.reduce((acc, g) => acc + g.files.length, 0) +
    unorganized.length;

  const hasHighConfidence = 
    matches.some(m => m.confidenceLevel === 'high') || 
    newGroups.some(g => g.confidenceLevel === 'high');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[92vh] max-h-[900px] overflow-hidden"
        >
          {/* =========================================================================
              ZONE 1: FIXED TOP HEADER & SUMMARY BAR
             ========================================================================= */}
          <div className="shrink-0 border-b border-white/10 bg-zinc-900/90 backdrop-blur-xl z-10">
            {/* Title Row */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Intelligent Organization Engine</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  Review Memory Suggestions
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  Grouped based strictly on verifiable metadata and timestamps ({totalFilesToOrganize} files analyzed).
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                title="Close modal (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Bar */}
            <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Counts */}
              <div className="flex items-center flex-wrap gap-2.5 text-xs">
                <span className="text-zinc-400">Analysis Summary:</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                  {matches.length} Existing Matches
                </span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
                  {newGroups.length} New Memories
                </span>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-white/10 text-zinc-300 font-medium">
                  {unorganized.length} Unorganized Files
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptHighConfidence}
                  disabled={isApplying || !hasHighConfidence}
                  className="px-3.5 py-1.5 rounded-xl font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check size={13} />
                  <span>Accept High Confidence</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playPop();
                    onKeepInInbox?.(unorganized);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                  Move All to Inbox
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ZONE 2: SCROLLABLE SUGGESTIONS AREA
             ========================================================================= */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">

            {/* If all groups are empty */}
            {matches.length === 0 && newGroups.length === 0 && unorganized.length === 0 && (
              <div className="text-center py-16 text-zinc-400 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3 text-zinc-500">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  All Files Organized
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  There are no pending suggestions to review. All media is assigned or in your library.
                </p>
              </div>
            )}

            {/* SECTION A: MATCH EXISTING MEMORIES */}
            {matches.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      A. Match Existing Memories ({matches.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Files matching existing memory dates or locations
                  </span>
                </div>

                <div className="space-y-4">
                  {matches.map((item) => {
                    const isExpanded = expandedGroupId === item.id || matches.length === 1;
                    const confidenceBadge = item.confidenceLevel === 'high'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                    return (
                      <div 
                        key={item.id}
                        className="border border-white/10 rounded-2xl bg-zinc-900/60 p-4 sm:p-5 transition-all hover:border-white/20"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Existing Memory Thumbnail */}
                            {item.targetMemory?.thumbnail ? (
                              <img
                                src={item.targetMemory.thumbnail}
                                alt=""
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10 shadow-md"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 shrink-0">
                                <Layers size={22} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${confidenceBadge}`}>
                                  {item.confidence}
                                </span>
                                <span className="text-xs text-zinc-400">
                                  {item.files.length} new files to add
                                </span>
                              </div>

                              <h5 className="text-base font-bold text-white truncate">
                                Add to "{item.targetMemory.title}"
                              </h5>

                              {/* Evidence reasons */}
                              <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-2">
                                {item.reasons.map((r, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                    <CheckCircle2 size={10} className="text-cyan-400" />
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <button
                              onClick={() => handleDismissMatch(item.id)}
                              className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-xs transition-colors"
                            >
                              Not Related
                            </button>
                          </div>
                        </div>

                        {/* Expandable File Grid with MediaThumbnail and Lightbox */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-white/10"
                            >
                              <p className="text-[11px] text-zinc-500 mb-2.5">
                                Click any thumbnail to view in full lightbox. Hover and click <X size={10} className="inline text-red-400" /> to remove a file from this memory.
                              </p>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                                {item.files.map((file, fIdx) => (
                                  <MediaThumbnail
                                    key={file.id}
                                    item={file}
                                    onClick={() => handleOpenLightbox(item.files, fIdx)}
                                    onRemove={() => handleRemoveFileFromMatch(item.id, file.id)}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION B: SUGGESTED NEW MEMORIES */}
            {newGroups.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      B. Suggested New Memories ({newGroups.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Clustered by real timestamps, GPS, folders, or sequences
                  </span>
                </div>

                <div className="space-y-4">
                  {newGroups.map((group) => {
                    const isExpanded = expandedGroupId === group.id || newGroups.length === 1;
                    const isEditing = editingGroupId === group.id;
                    const confidenceBadge = group.confidenceLevel === 'high'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : (group.confidenceLevel === 'medium' 
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-white/10');

                    return (
                      <div 
                        key={group.id}
                        className="border border-white/10 rounded-2xl bg-zinc-900/60 p-4 sm:p-5 transition-all hover:border-white/20"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            {/* Confidence & Item count */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${confidenceBadge}`}>
                                {group.confidence}
                              </span>
                              <span className="text-xs text-zinc-400 font-medium">
                                {group.files.length} items
                              </span>
                            </div>

                            {/* Editable Title */}
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={tempTitle}
                                  autoFocus
                                  onChange={(e) => setTempTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(group.id);
                                    if (e.key === 'Escape') setEditingGroupId(null);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/30 text-sm text-white font-bold focus:outline-none focus:border-white"
                                />
                                <button
                                  onClick={() => handleSaveRename(group.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingGroupId(null)}
                                  className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h5 className="text-base sm:text-lg font-bold text-white truncate">
                                  "{group.suggestedTitle}"
                                </h5>
                                <button
                                  onClick={() => handleStartRename(group)}
                                  className="p-1 text-zinc-400 hover:text-white transition-colors"
                                  title="Rename suggested memory"
                                >
                                  <Edit2 size={13} />
                                </button>
                              </div>
                            )}

                            {/* Verified vs Inferred Date and Location badges */}
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 mt-2">
                              {/* Date Indicator */}
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                <Calendar size={12} className="text-zinc-400" />
                                {group.suggestedDate ? (
                                  <>
                                    <span className="text-zinc-200">
                                      {new Date(group.suggestedDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    {group.dateStatus === 'verified' && (
                                      <span className="text-[9px] font-bold text-emerald-400 uppercase">
                                        Verified
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-zinc-500 italic">Date unknown</span>
                                )}
                              </div>

                              {/* Location Indicator */}
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                                <MapPin size={12} className="text-zinc-400" />
                                {group.suggestedLocation ? (
                                  <>
                                    <span className="text-zinc-200">{group.suggestedLocation}</span>
                                    {group.locationStatus === 'verified' && (
                                      <span className="text-[9px] font-bold text-emerald-400 uppercase">
                                        GPS
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-zinc-500 italic">Location unknown</span>
                                )}
                              </div>
                            </div>

                            {/* Reasons / Evidence */}
                            {group.reasons && group.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {group.reasons.map((r, i) => (
                                  <span key={i} className="text-[11px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                    • {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => toggleExpand(group.id)}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect Files'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <button
                              onClick={() => handleDismissNewGroup(group.id)}
                              className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 text-xs transition-colors"
                            >
                              Keep in Inbox
                            </button>
                          </div>
                        </div>

                        {/* Expandable Media Grid with MediaThumbnail and Lightbox */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-white/10"
                            >
                              <p className="text-[11px] text-zinc-500 mb-2.5">
                                Click any thumbnail to preview. Click <X size={10} className="inline text-red-400" /> to move a photo to Unorganized.
                              </p>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                                {group.files.map((file, fIdx) => (
                                  <MediaThumbnail
                                    key={file.id}
                                    item={file}
                                    onClick={() => handleOpenLightbox(group.files, fIdx)}
                                    onRemove={() => handleRemoveFileFromGroup(group.id, file.id)}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION C: UNORGANIZED FILES INBOX */}
            {unorganized.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      C. Unorganized Inbox ({unorganized.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Saved to library for manual assignment
                  </span>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-white/5">
                  <p className="text-xs text-zinc-400 mb-3">
                    These files did not have sufficient matching metadata or chronological proximity to group automatically. They remain safely stored in your Media Library.
                  </p>
                  
                  <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {unorganized.slice(0, 30).map((file, fIdx) => (
                      <MediaThumbnail
                        key={file.id}
                        item={file}
                        onClick={() => handleOpenLightbox(unorganized, fIdx)}
                      />
                    ))}
                    {unorganized.length > 30 && (
                      <div className="aspect-square rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-xs font-semibold text-zinc-400">
                        <span>+{unorganized.length - 30}</span>
                        <span className="text-[9px] text-zinc-500">more</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* =========================================================================
              ZONE 3: FIXED BOTTOM ACTION BAR
             ========================================================================= */}
          <div className="shrink-0 p-5 sm:p-6 border-t border-white/10 bg-zinc-900/90 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
            <p className="text-xs text-zinc-400 max-w-md">
              Confirming will create the approved memories and update matches in your collection immediately.
            </p>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAll}
                disabled={isApplying}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: currentTheme.colors.accent }}
              >
                <Check size={15} />
                <span>{isApplying ? 'Applying Changes...' : 'Apply Approved Changes'}</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Lightbox for Previewing Full-Resolution Media */}
      <MediaLightbox
        items={lightboxItems}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
