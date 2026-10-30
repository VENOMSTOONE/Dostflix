import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  FolderPlus, 
  CheckSquare, 
  Square, 
  Video, 
  Image as ImageIcon,
  Copy,
  Calendar,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Check,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useMemories } from '../../context/MemoryContext';
import { deleteMediaFile, updateMediaFile } from '../../services/indexedDbStorage';
import soundFx from '../../utils/soundFx';
import MediaThumbnail from './MediaThumbnail';
import MediaLightbox from './MediaLightbox';

export default function MediaLibraryView({
  allMedia = [],
  onRefresh,
  onAssignToMemory,
  onCreateMemoryFromSelected,
}) {
  const { currentTheme } = useTheme();
  const { memories, addAssetToMemory } = useMemories();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'photos' | 'videos' | 'unorganized' | 'assigned' | 'duplicates'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Filter media based on tab & search
  const filteredMedia = useMemo(() => {
    let list = [...allMedia];

    // Tab filter
    if (activeTab === 'photos') list = list.filter(m => m.mediaType === 'image');
    else if (activeTab === 'videos') list = list.filter(m => m.mediaType === 'video');
    else if (activeTab === 'unorganized') list = list.filter(m => !m.assignedMemoryId);
    else if (activeTab === 'assigned') list = list.filter(m => Boolean(m.assignedMemoryId));
    else if (activeTab === 'duplicates') list = list.filter(m => m.isDuplicate);

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        (m.originalFilename || '').toLowerCase().includes(q) ||
        (m.folderName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [allMedia, activeTab, searchQuery]);

  const toggleSelect = (id) => {
    soundFx.playClick();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    soundFx.playClick();
    if (selectedIds.length === filteredMedia.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMedia.map(m => m.id));
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} files from your media vault?`)) return;
    soundFx.playPop();

    for (const id of selectedIds) {
      await deleteMediaFile(id);
    }
    setSelectedIds([]);
    await onRefresh?.();
  };

  // Bulk Download
  const handleBulkDownload = () => {
    soundFx.playPop();
    const toDownload = allMedia.filter(m => selectedIds.includes(m.id));
    toDownload.forEach(item => {
      if (item.fileBlob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(item.fileBlob);
        a.download = item.originalFilename || 'dostflix-memory';
        a.click();
      }
    });
  };

  // Bulk Move to Inbox (Unassign)
  const handleMoveToInbox = async () => {
    soundFx.playPop();
    for (const id of selectedIds) {
      await updateMediaFile(id, { assignedMemoryId: null });
    }
    setSelectedIds([]);
    await onRefresh?.();
  };

  // Bulk Assign to an existing memory
  const handleAssignToMemory = async (memoryId) => {
    soundFx.playPop();
    const toAssign = allMedia.filter(m => selectedIds.includes(m.id));
    for (const item of toAssign) {
      await updateMediaFile(item.id, { assignedMemoryId: memoryId });
      addAssetToMemory(memoryId, item);
    }
    setAssignDropdownOpen(false);
    setSelectedIds([]);
    await onRefresh?.();
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Filter Tabs + View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {[
            { id: 'all', label: `All (${allMedia.length})` },
            { id: 'photos', label: 'Photos' },
            { id: 'videos', label: 'Videos' },
            { id: 'unorganized', label: 'Unorganized' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'duplicates', label: 'Duplicates' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(tab.id);
                setSelectedIds([]);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? 'bg-white text-zinc-950 font-bold border-white shadow'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-white border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => {
                soundFx.playClick();
                setViewMode('list');
              }}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Bar (Appears when items are selected) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-medium"
              >
                <CheckSquare size={15} className="text-emerald-400" />
                <span>{selectedIds.length} of {filteredMedia.length} Selected</span>
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Deselect All
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Assign to Memory Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAssignDropdownOpen(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <FolderPlus size={14} />
                  <span>Assign to Memory</span>
                </button>

                {assignDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-56 overflow-y-auto no-scrollbar">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2 py-1">
                      Choose Memory
                    </p>
                    {memories.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleAssignToMemory(m.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs text-zinc-200 hover:text-white truncate"
                      >
                        {m.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create new memory from selected */}
              <button
                onClick={() => {
                  const selectedItems = allMedia.filter(m => selectedIds.includes(m.id));
                  onCreateMemoryFromSelected?.(selectedItems);
                }}
                className="px-3 py-1.5 rounded-xl font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles size={13} />
                <span>Create Memory</span>
              </button>

              {/* Move to Inbox */}
              <button
                onClick={handleMoveToInbox}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Unassign and send to inbox"
              >
                Move to Inbox
              </button>

              {/* Download */}
              <button
                onClick={handleBulkDownload}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Download selected"
              >
                <Download size={14} />
              </button>

              {/* Delete */}
              <button
                onClick={handleBulkDelete}
                className="p-1.5 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                title="Delete selected files"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredMedia.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <div key={item.id} className="relative group">
                <MediaThumbnail
                  item={item}
                  aspectRatio="square"
                  selectable
                  selected={isSelected}
                  onSelect={() => toggleSelect(item.id)}
                  onClick={() => openLightbox(idx)}
                />

                {/* Inspect Button overlay */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(idx);
                  }}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all border border-white/10 z-10"
                  title="View fullscreen"
                >
                  <Eye size={12} />
                </button>

                {/* Assigned Tag */}
                {item.assignedMemoryId && (
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] text-zinc-300 font-medium border border-white/10 pointer-events-none">
                    Assigned
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Media List View */
        <div className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 bg-zinc-950/40">
          {filteredMedia.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);
            const isVideo = item.mediaType === 'video';

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-3 sm:px-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-500/10' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 flex items-center justify-center shrink-0">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-emerald-500 border-emerald-500 text-zinc-950' : 'border-white/20'
                    }`}>
                      {isSelected && <Check size={11} className="stroke-[3]" />}
                    </div>
                  </div>

                  <div 
                    className="w-12 h-12 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(idx);
                    }}
                  >
                    <MediaThumbnail
                      item={item}
                      aspectRatio="square"
                      showBadges={false}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-white text-xs truncate block">
                      {item.originalFilename}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {isVideo ? 'Video' : 'Photo'} • {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                      {item.captureDate && ` • ${new Date(item.captureDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(idx);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                    title="Inspect details"
                  >
                    <Eye size={13} />
                  </button>

                  <div className="text-right text-xs text-zinc-400">
                    {item.assignedMemoryId ? (
                      <span className="text-emerald-400 font-medium text-[11px]">Assigned</span>
                    ) : (
                      <span className="text-zinc-500 text-[11px]">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="py-20 text-center text-zinc-500 text-xs">
          No media files match this filter. Upload new files in the "Upload & Organize" tab.
        </div>
      )}

      {/* Full Lightbox */}
      <MediaLightbox
        items={filteredMedia}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />

    </div>
  );
}
