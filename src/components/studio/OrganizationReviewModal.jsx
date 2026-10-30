import React, { useState } from 'react';
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
  Split,
  Merge,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';

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

  if (!isOpen) return null;

  // Toggle card expansion
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

    setUnorganized(prev => [...prev, fileToMove]);
  };

  // Dismiss a match suggestion (moves files to unorganized)
  const handleDismissMatch = (matchId) => {
    soundFx.playPop();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setMatches(prev => prev.filter(m => m.id !== matchId));
    setUnorganized(prev => [...prev, ...match.files]);
  };

  // Dismiss a new group suggestion (moves files to unorganized)
  const handleDismissNewGroup = (groupId) => {
    soundFx.playPop();
    const group = newGroups.find(g => g.id === groupId);
    if (!group) return;

    setNewGroups(prev => prev.filter(g => g.id !== groupId));
    setUnorganized(prev => [...prev, ...group.files]);
  };

  // 1-Click: Accept All High Confidence Suggestions
  const handleAcceptHighConfidence = async () => {
    soundFx.playPop();
    setIsApplying(true);

    const highMatches = matches.filter(m => m.confidenceLevel === 'high');
    const highNewGroups = newGroups.filter(g => g.confidenceLevel === 'high');

    await onApplyMatches(highMatches);
    await onCreateSuggestedMemories(highNewGroups);

    // Filter out accepted
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

    if (matches.length > 0) {
      await onApplyMatches(matches);
    }
    if (newGroups.length > 0) {
      await onCreateSuggestedMemories(newGroups);
    }

    setIsApplying(false);
    onClose();
  };

  const totalFilesToOrganize = 
    matches.reduce((acc, m) => acc + m.files.length, 0) +
    newGroups.reduce((acc, g) => acc + g.files.length, 0) +
    unorganized.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Sparkles size={14} />
              <span>Intelligent Organization Engine</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Review Memory Suggestions
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dostflix clustered {totalFilesToOrganize} files based on timestamps, locations, and folders. You have complete control over what gets applied.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Batch Action Bar */}
        <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Suggestions:</span>
            <span className="font-semibold text-white">{matches.length} Existing Matches</span>
            <span className="text-zinc-600">•</span>
            <span className="font-semibold text-white">{newGroups.length} New Memories</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{unorganized.length} Unorganized</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAcceptHighConfidence}
              disabled={isApplying || (!matches.some(m => m.confidenceLevel === 'high') && !newGroups.some(g => g.confidenceLevel === 'high'))}
              className="px-3.5 py-1.5 rounded-xl font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Check size={13} />
              <span>Accept High Confidence</span>
            </button>

            <button
              onClick={() => {
                onKeepInInbox?.(unorganized);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Move All to Inbox
            </button>
          </div>
        </div>

        {/* Body Sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">

          {/* CATEGORY A: MATCH EXISTING MEMORIES */}
          {matches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  A. Match Existing Memories ({matches.length})
                </h4>
              </div>

              <div className="space-y-4">
                {matches.map((item) => {
                  const isExpanded = expandedGroupId === item.id;
                  const confidenceBadge = item.confidenceLevel === 'high'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                  return (
                    <div 
                      key={item.id}
                      className="border border-white/10 rounded-2xl bg-zinc-950/40 p-4 sm:p-5 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Existing Memory Thumbnail */}
                          <img
                            src={item.targetMemory.thumbnail}
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10 shadow-md"
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${confidenceBadge}`}>
                                {item.confidence}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {item.files.length} new photos/videos
                              </span>
                            </div>
                            <h5 className="text-base font-bold text-white truncate">
                              Add to "{item.targetMemory.title}"
                            </h5>
                            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-2">
                              {item.reasons.map((r, i) => (
                                <span key={i} className="text-zinc-400">• {r}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button
                            onClick={() => handleDismissMatch(item.id)}
                            className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                          >
                            Not Related
                          </button>
                        </div>
                      </div>

                      {/* Expandable Media Preview Collages */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/5"
                          >
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                              {item.files.map(file => (
                                <div key={file.id} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                                  <img src={file.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
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

          {/* CATEGORY B: SUGGESTED NEW MEMORIES */}
          {newGroups.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  B. Suggested New Memories ({newGroups.length})
                </h4>
              </div>

              <div className="space-y-4">
                {newGroups.map((group) => {
                  const isExpanded = expandedGroupId === group.id;
                  const isEditing = editingGroupId === group.id;
                  const confidenceBadge = group.confidenceLevel === 'high'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

                  return (
                    <div 
                      key={group.id}
                      className="border border-white/10 rounded-2xl bg-zinc-950/40 p-4 sm:p-5 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${confidenceBadge}`}>
                              {group.confidence}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {group.files.length} items
                            </span>
                          </div>

                          {/* Editable Title */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/20 text-sm text-white font-bold focus:outline-none focus:border-white/40"
                              />
                              <button
                                onClick={() => handleSaveRename(group.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h5 className="text-base font-bold text-white truncate">
                                "{group.suggestedTitle}"
                              </h5>
                              <button
                                onClick={() => handleStartRename(group)}
                                className="p-1 text-zinc-500 hover:text-white transition-colors"
                                title="Rename this suggested memory"
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-2">
                            {group.suggestedDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={13} />
                                {new Date(group.suggestedDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {group.suggestedLocation && (
                              <span className="flex items-center gap-1">
                                <MapPin size={13} />
                                {group.suggestedLocation}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleExpand(group.id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect Files'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button
                            onClick={() => handleDismissNewGroup(group.id)}
                            className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                          >
                            Keep in Inbox
                          </button>
                        </div>
                      </div>

                      {/* Expandable File Collage with Move/Remove controls */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-white/5"
                          >
                            <p className="text-[11px] text-zinc-500 mb-2">
                              Click the <X size={10} className="inline text-red-400" /> on any photo to remove it from this group.
                            </p>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                              {group.files.map(file => (
                                <div key={file.id} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                                  <img src={file.thumbnail} alt="" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => handleRemoveFileFromGroup(group.id, file.id)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow"
                                    title="Move to unorganized inbox"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
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

          {/* CATEGORY C: UNORGANIZED FILES */}
          {unorganized.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                  C. Unorganized Inbox ({unorganized.length})
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/20 border border-white/5">
                <p className="text-xs text-zinc-400 mb-3">
                  These files did not have strong enough signals to group automatically. They will be stored in your Media Library for manual assignment anytime.
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {unorganized.slice(0, 20).map(file => (
                    <div key={file.id} className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                      <img src={file.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {unorganized.length > 20 && (
                    <div className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-400">
                      +{unorganized.length - 20}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-zinc-400">
            Applying changes will create the new memories and update matched existing memories immediately.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmAll}
              disabled={isApplying}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              style={{ backgroundColor: currentTheme.colors.accent }}
            >
              <Check size={15} />
              <span>{isApplying ? 'Applying...' : 'Apply Approved Changes'}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
