import React, { useState, useRef } from 'react';
import { Upload, FolderPlus, Image, Video, Sparkles, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';

export default function UploadDropzone({ onFilesSelected, isUploading = false }) {
  const { currentTheme } = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    soundFx.playPop();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      soundFx.playPop();
      onFilesSelected(e.target.files);
      e.target.value = ''; // Reset input to allow re-selecting same files
    }
  };

  const handleFolderChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      soundFx.playPop();
      onFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file & folder inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/jpg,video/mp4,video/quicktime,video/webm,video/m4v"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFolderChange}
        className="hidden"
      />

      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.003 }}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 md:p-16 text-center transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
            : 'border-white/10 hover:border-white/20 bg-gradient-to-b from-white/[0.04] to-white/[0.01]'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Subtle Ambient Radial Highlight */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: currentTheme.colors.accent }}
        />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          {/* Animated Central Icon Pill */}
          <div className="w-20 h-20 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
            <Upload size={32} style={{ color: currentTheme.colors.accent }} />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Drop your memories here.
          </h3>

          <p className="text-zinc-400 text-sm sm:text-base font-normal leading-relaxed mb-8 max-w-lg">
            Photos, videos, or entire folders. Bring everything together without quality loss.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5" onClick={(e) => e.stopPropagation()}>
            {/* Primary Add Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              style={{ backgroundColor: currentTheme.colors.accent }}
            >
              <Plus size={18} />
              <span>ADD YOUR MEMORIES</span>
            </button>

            {/* Folder Select Button */}
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-5 py-3 rounded-2xl font-semibold text-sm text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 active:scale-95 transition-all flex items-center gap-2"
              title="Upload an entire directory of photos/videos"
            >
              <FolderPlus size={18} className="text-emerald-400" />
              <span>Upload Folder</span>
            </button>
          </div>

          {/* Supported Format Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1"><Image size={12} /> JPG, PNG, WEBP, HEIC</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Video size={12} /> MP4, MOV, WEBM, M4V</span>
            <span>•</span>
            <span>Up to 100+ files per batch</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
