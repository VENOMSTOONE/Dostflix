import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Star, 
  Play, 
  Video, 
  Image as ImageIcon,
  Check,
  Eye,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useMemories } from '../../context/MemoryContext';
import soundFx from '../../utils/soundFx';

export default function ManageMediaModal({
  memory,
  isOpen = false,
  onClose,
}) {
  const { currentTheme } = useTheme();
  const { reorderAssets, removeAssetFromMemory, addAssetToMemory, setCoverImage } = useMemories();
  
  const [activePreviewMedia, setActivePreviewMedia] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen || !memory) return null;

  const assets = memory.assets || [];
  const currentCover = memory.thumbnail;

  // Move asset earlier in array
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= assets.length) return;

    soundFx.playClick();
    const copy = [...assets];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    reorderAssets(memory.id, copy);
  };

  // Set as cover
  const handleSetCover = (assetUrl) => {
    soundFx.playPop();
    setCoverImage(memory.id, assetUrl);
  };

  // Remove asset
  const handleRemove = (assetUrl) => {
    soundFx.playPop();
    removeAssetFromMemory(memory.id, assetUrl);
  };

  // Upload more files directly
  const handleAddFiles = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      soundFx.playPop();
      Array.from(e.target.files).forEach(file => {
        const url = URL.createObjectURL(file);
        addAssetToMemory(memory.id, url);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-950/40">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1 block">
              Media Manager
            </span>
            <h3 className="text-xl font-bold text-white">
              Manage Media for "{memory.title}" ({assets.length} items)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Reorder sequence, set cover photo, remove items, or add new videos and photos.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between gap-4 text-xs">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleAddFiles}
            className="hidden"
          />

          <span className="text-zinc-400">
            Current Cover: <span className="font-semibold text-white">Position #{assets.indexOf(currentCover) + 1}</span>
          </span>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            style={{ backgroundColor: currentTheme.colors.accent }}
          >
            <Upload size={14} />
            <span>Upload Additional Media</span>
          </button>
        </div>

        {/* Media Grid with Order Controls */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {assets.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 text-xs">
              No media in this memory. Click "Upload Additional Media" above.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((assetUrl, idx) => {
                const isCover = currentCover === assetUrl;
                const isVideo = typeof assetUrl === 'string' && assetUrl.match(/\.(mp4|mov|webm)(\?.*)?$/i);

                return (
                  <div
                    key={idx}
                    className={`relative rounded-2xl overflow-hidden bg-zinc-950 border-2 transition-all flex flex-col ${
                      isCover 
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Media Thumbnail / Preview */}
                    <div className="relative aspect-square w-full bg-black/60 overflow-hidden">
                      {isVideo ? (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 relative">
                          <video src={assetUrl} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Video size={24} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <img src={assetUrl} alt="" className="w-full h-full object-cover" />
                      )}

                      {/* Position Pill */}
                      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10">
                        #{idx + 1}
                      </span>

                      {/* Cover Badge */}
                      {isCover && (
                        <span className="absolute top-2 right-2 bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow">
                          COVER
                        </span>
                      )}
                    </div>

                    {/* Controls Footer */}
                    <div className="p-2.5 bg-zinc-900 flex items-center justify-between gap-1 text-zinc-400 border-t border-white/5">
                      {/* Move Left */}
                      <button
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-colors"
                        title="Move Earlier"
                      >
                        <ArrowLeft size={13} />
                      </button>

                      {/* Set as Cover */}
                      {!isCover && (
                        <button
                          onClick={() => handleSetCover(assetUrl)}
                          className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                          title="Make this the cover photo"
                        >
                          Make Cover
                        </button>
                      )}

                      {/* Move Right */}
                      <button
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === assets.length - 1}
                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-colors"
                        title="Move Later"
                      >
                        <ArrowRight size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemove(assetUrl)}
                        className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors ml-1"
                        title="Remove from memory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>

      </motion.div>
    </div>
  );
}
