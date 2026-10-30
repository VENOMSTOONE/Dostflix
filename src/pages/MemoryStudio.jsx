import React, { useState, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  Upload, 
  Layers, 
  Plus, 
  FolderPlus, 
  Film, 
  Settings, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Check, 
  AlertCircle,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useMemories } from '../context/MemoryContext';
import soundFx from '../utils/soundFx';
import confetti from 'canvas-confetti';

// Subcomponents
import UploadDropzone from '../components/studio/UploadDropzone';
import UploadQueueView from '../components/studio/UploadQueueView';
import OrganizationReviewModal from '../components/studio/OrganizationReviewModal';
import CreateMemoryModal from '../components/studio/CreateMemoryModal';
import EditMemoryModal from '../components/studio/EditMemoryModal';
import ManageMediaModal from '../components/studio/ManageMediaModal';
import MediaLibraryView from '../components/studio/MediaLibraryView';
import StorageStatusBadge from '../components/studio/StorageStatusBadge';

// Services
import { BatchQueueRunner } from '../services/mediaProcessor';
import { analyzeAndOrganizeBatch } from '../services/organizationEngine';
import { updateMediaFile } from '../services/indexedDbStorage';

export default function MemoryStudio() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { memories, deleteMemory, addMemory, addAssetToMemory, allMediaFiles, refreshMedia } = useMemories();

  // Active Main Tab: 'upload' | 'memories' | 'library'
  const [activeTab, setActiveTab] = useState('upload');

  // Upload Queue State
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const queueRunnerRef = useRef(null);

  // Analysis & Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialFiles, setCreateInitialFiles] = useState([]);
  const [editingMemory, setEditingMemory] = useState(null);
  const [managingMediaMemory, setManagingMediaMemory] = useState(null);
  const [deletingMemory, setDeletingMemory] = useState(null);
  const [deleteAlsoMedia, setDeleteAlsoMedia] = useState(false);

  // Initialize or get the BatchQueueRunner instance
  const getQueueRunner = useCallback(() => {
    if (!queueRunnerRef.current) {
      const runner = new BatchQueueRunner(3); // 3 concurrent files

      runner.onItemProgress = (item) => {
        setUploadQueue(prev => prev.map(i => i.id === item.id ? { ...item } : i));
      };

      runner.onItemComplete = (item, result) => {
        setUploadQueue(prev => prev.map(i => i.id === item.id ? { ...item } : i));
        refreshMedia();
      };

      runner.onItemError = (item, err) => {
        setUploadQueue(prev => prev.map(i => i.id === item.id ? { ...item } : i));
      };

      runner.onAllComplete = (queue) => {
        soundFx.playPop();
        refreshMedia();
      };

      queueRunnerRef.current = runner;
    }
    return queueRunnerRef.current;
  }, [refreshMedia]);

  // Handle files selected via Drag-and-Drop or File Picker
  const handleFilesSelected = (files) => {
    const runner = getQueueRunner();
    const newItems = runner.addFiles(files);
    setUploadQueue(prev => [...prev, ...newItems]);
  };

  // Run the Intelligent Organization Engine on processed files
  const handleStartOrganization = () => {
    soundFx.playPop();
    const completedItems = uploadQueue
      .filter(item => item.status === 'completed' && item.result)
      .map(item => item.result);

    // If queue is empty, fallback to unassigned media in local vault
    const filesToAnalyze = completedItems.length > 0
      ? completedItems
      : allMediaFiles.filter(m => !m.assignedMemoryId);

    if (filesToAnalyze.length === 0) {
      alert("No uploaded files available to analyze. Please upload photos or videos first.");
      return;
    }

    const results = analyzeAndOrganizeBatch(filesToAnalyze, memories);
    setAnalysisResults(results);
    setIsReviewModalOpen(true);
  };

  // Apply suggestions from review modal: Add files to existing memories
  const handleApplyMatches = async (matchesToApply) => {
    for (const match of matchesToApply) {
      const memoryId = match.targetMemory.id;
      for (const file of match.files) {
        addAssetToMemory(memoryId, file);
        await updateMediaFile(file.id, { assignedMemoryId: memoryId });
      }
    }
    await refreshMedia();
  };

  // Apply suggestions from review modal: Create suggested new memories
  const handleCreateSuggestedMemories = async (groupsToCreate) => {
    for (const group of groupsToCreate) {
      const assetUrls = group.files.map(f => f.previewUrl || f.thumbnail || f.fileUrl).filter(Boolean);
      const newMem = addMemory({
        title: group.suggestedTitle,
        date: group.suggestedDate ? group.suggestedDate.split('T')[0] : (new Date().toISOString().split('T')[0]),
        location: group.suggestedLocation || '',
        collectionId: group.suggestedCategory || 'coll-keepsakes',
        mood: group.suggestedMood || 'happy',
        assets: assetUrls,
        thumbnail: assetUrls[0],
      });

      // Link files to new memory in IndexedDB
      for (const file of group.files) {
        await updateMediaFile(file.id, { assignedMemoryId: newMem.id });
      }
    }
    await refreshMedia();
    confetti({ particleCount: 50, spread: 70 });
  };

  // Confirm Memory Deletion
  const handleConfirmDelete = async () => {
    if (!deletingMemory) return;
    soundFx.playPop();

    await deleteMemory(deletingMemory.id, deleteAlsoMedia);
    setDeletingMemory(null);
    setDeleteAlsoMedia(false);
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-white px-4 sm:px-8 md:px-14 py-8 md:py-12 relative overflow-x-hidden select-none">
      
      {/* Ambient Radial Studio Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] rounded-full blur-[190px] pointer-events-none -z-10 transition-colors duration-1000 opacity-20"
        style={{ backgroundColor: currentTheme.colors.accent }}
      />

      {/* HEADER SECTION: Cinematic Studio Banner */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: currentTheme.colors.accent }}>
            <Film size={14} />
            <span>Dostflix Production Center</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
            Memory Studio
          </h1>

          <p className="text-zinc-400 text-sm max-w-xl font-normal leading-relaxed">
            The central command center for Dostflix. Upload photos and videos in bulk, intelligently organize clusters, and curate your squad's memory vault.
          </p>

          <div className="mt-4">
            <StorageStatusBadge totalMediaCount={allMediaFiles.length} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playPop();
              setCreateInitialFiles([]);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            style={{ backgroundColor: currentTheme.colors.accent }}
          >
            <Plus size={16} />
            <span>Create New Memory</span>
          </button>
        </div>
      </div>

      {/* STUDIO NAVIGATION TABS */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('upload');
            }}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload size={15} />
            <span>Upload & Organize</span>
            {uploadQueue.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'upload' ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-white'
              }`}>
                {uploadQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('memories');
            }}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'memories'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={15} />
            <span>Manage Memories</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'memories' ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-white'
            }`}>
              {memories.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('library');
            }}
            className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'library'
                ? 'bg-white text-zinc-950 font-bold shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HardDrive size={15} />
            <span>Media Library</span>
            {allMediaFiles.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'library' ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-white'
              }`}>
                {allMediaFiles.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN STUDIO SECTIONS */}
      <div className="max-w-6xl mx-auto space-y-10">

        {/* TAB 1: BULK MEDIA UPLOAD & REAL-TIME QUEUE */}
        {activeTab === 'upload' && (
          <section className="space-y-6">
            <UploadDropzone
              onFilesSelected={handleFilesSelected}
              isUploading={uploadQueue.some(i => i.status === 'processing')}
            />

            {/* Upload Queue Section */}
            {uploadQueue.length > 0 && (
              <UploadQueueView
                queue={uploadQueue}
                isPaused={isQueuePaused}
                onPause={() => {
                  queueRunnerRef.current?.pause();
                  setIsQueuePaused(true);
                }}
                onResume={() => {
                  queueRunnerRef.current?.resume();
                  setIsQueuePaused(false);
                }}
                onCancel={() => {
                  queueRunnerRef.current?.cancel();
                  setUploadQueue([]);
                }}
                onRetryItem={(itemId) => queueRunnerRef.current?.retryItem(itemId)}
                onRemoveItem={(itemId) => {
                  queueRunnerRef.current?.removeItem(itemId);
                  setUploadQueue(prev => prev.filter(i => i.id !== itemId));
                }}
                onAddMore={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*,video/*';
                  input.onchange = (e) => {
                    if (e.target.files) handleFilesSelected(e.target.files);
                  };
                  input.click();
                }}
                onStartOrganization={handleStartOrganization}
              />
            )}
          </section>
        )}

        {/* TAB 2: MANAGE EXISTING MEMORIES */}
        {activeTab === 'memories' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>All Active Memories</span>
                <span className="text-xs font-normal text-zinc-500">({memories.length})</span>
              </h3>

              <button
                onClick={() => {
                  soundFx.playPop();
                  setCreateInitialFiles([]);
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors border border-white/10 flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>New Memory</span>
              </button>
            </div>

            {/* Memory Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map((mem) => {
                const assetCount = (mem.assets && mem.assets.length) || 1;

                return (
                  <div
                    key={mem.id}
                    className="border border-white/10 rounded-3xl overflow-hidden bg-zinc-950/60 backdrop-blur-xl shadow-xl flex flex-col group transition-all hover:border-white/20"
                  >
                    {/* Cover Image & Quick View Link */}
                    <div 
                      onClick={() => navigate(`/memory/${mem.id}`)}
                      className="relative aspect-[16/10] overflow-hidden cursor-pointer"
                    >
                      <img
                        src={mem.thumbnail}
                        alt={mem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Pill Badge */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                        {mem.mediaType || 'mixed'}
                      </div>

                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
                        {assetCount} items
                      </div>

                      {/* Bottom Banner inside Image */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h4 className="text-lg font-bold text-white drop-shadow truncate">
                          {mem.title}
                        </h4>
                        <p className="text-xs text-zinc-300 truncate mt-0.5">
                          {mem.date} • {mem.location}
                        </p>
                      </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {mem.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mem.people?.map(p => (
                          <span key={p} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-zinc-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-3 bg-zinc-900/60 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => {
                          soundFx.playPop();
                          setEditingMemory(mem);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          soundFx.playPop();
                          setManagingMediaMemory(mem);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                      >
                        <Film size={13} />
                        <span>Manage Media</span>
                      </button>

                      <button
                        onClick={() => {
                          soundFx.playPop();
                          setDeletingMemory(mem);
                        }}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: MEDIA LIBRARY (CENTRALIZED BROWSER) */}
        {activeTab === 'library' && (
          <section>
            <MediaLibraryView
              allMedia={allMediaFiles}
              onRefresh={refreshMedia}
              onCreateMemoryFromSelected={(selectedFiles) => {
                soundFx.playPop();
                setCreateInitialFiles(selectedFiles);
                setIsCreateModalOpen(true);
              }}
            />
          </section>
        )}

      </div>

      {/* MODAL 1: ORGANIZATION REVIEW SCREEN */}
      {analysisResults && (
        <OrganizationReviewModal
          isOpen={isReviewModalOpen}
          analysisResults={analysisResults}
          onClose={() => setIsReviewModalOpen(false)}
          onApplyMatches={handleApplyMatches}
          onCreateSuggestedMemories={handleCreateSuggestedMemories}
          onKeepInInbox={async (unorganizedFiles) => {
            await refreshMedia();
          }}
        />
      )}

      {/* MODAL 2: CREATE NEW MEMORY */}
      <CreateMemoryModal
        isOpen={isCreateModalOpen}
        initialFiles={createInitialFiles}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          refreshMedia();
          setActiveTab('memories');
        }}
      />

      {/* MODAL 3: EDIT MEMORY */}
      {editingMemory && (
        <EditMemoryModal
          memory={editingMemory}
          isOpen={Boolean(editingMemory)}
          onClose={() => setEditingMemory(null)}
          onSaved={() => refreshMedia()}
        />
      )}

      {/* MODAL 4: MANAGE MEDIA IN MEMORY */}
      {managingMediaMemory && (
        <ManageMediaModal
          memory={managingMediaMemory}
          isOpen={Boolean(managingMediaMemory)}
          onClose={() => setManagingMediaMemory(null)}
        />
      )}

      {/* MODAL 5: DELETE MEMORY CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deletingMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>

              <h4 className="text-xl font-bold text-white mb-1.5">
                Delete "{deletingMemory.title}"?
              </h4>

              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                This will remove this memory from your Dostflix homepage, timeline, keepsakes, and search.
              </p>

              {/* Option to also delete or retain stored media in library */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-white/10 cursor-pointer mb-6 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={deleteAlsoMedia}
                  onChange={(e) => setDeleteAlsoMedia(e.target.checked)}
                  className="rounded border-white/20 text-red-500 focus:ring-0"
                />
                <span>Also permanently delete original media files from local vault</span>
              </label>

              <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDeletingMemory(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg active:scale-95"
                >
                  Delete Memory
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
