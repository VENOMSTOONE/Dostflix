import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Camera, 
  Info, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Clock,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../../services/indexedDbStorage';
import soundFx from '../../utils/soundFx';

export default function MediaLightbox({
  items = [],
  initialIndex = 0,
  isOpen = false,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    soundFx.playClick();
    setHasError(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    soundFx.playClick();
    setHasError(false);
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentItem) return null;

  const isVideo = currentItem.mediaType === 'video' || currentItem.fileType?.startsWith('video/') || Boolean(currentItem.originalFilename?.match(/\.(mp4|mov|webm|m4v)$/i));
  const mediaUrl = resolveMediaUrl(currentItem);
  const filename = currentItem.originalFilename || currentItem.name || 'Media File';

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-2xl select-none">
      {/* Top Controls Bar */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between gap-4 z-20 bg-zinc-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-zinc-300">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
            {filename}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(prev => !prev)}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              showInfo 
                ? 'bg-white/20 border-white/30 text-white' 
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Toggle metadata panel"
          >
            <Info size={16} />
            <span className="hidden sm:inline">Details</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
            title="Close viewer (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Media Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        {/* Previous Button */}
        {items.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Media Frame */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {!hasError && mediaUrl && !currentItem.isUnsupportedPreview ? (
            isVideo ? (
              <video
                key={currentItem.id}
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[75vh] max-w-[85vw] rounded-2xl shadow-2xl object-contain border border-white/10"
                onError={() => setHasError(true)}
              />
            ) : (
              <img
                key={currentItem.id}
                src={mediaUrl}
                alt={filename}
                className="max-h-[75vh] max-w-[85vw] rounded-2xl shadow-2xl object-contain border border-white/10 select-none"
                onError={() => setHasError(true)}
              />
            )
          ) : (
            /* Fallback View for unsupported or corrupted formats */
            <div className="w-96 p-8 rounded-3xl bg-zinc-900 border border-white/10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 mb-4">
                <FileText size={32} />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {filename}
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                {currentItem.isUnsupportedPreview 
                  ? 'Preview format not directly supported in this browser. File is safely stored.' 
                  : 'Unable to render preview image.'}
              </p>
              <div className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-white/5 text-zinc-300">
                {formatFileSize(currentItem.fileSize)} • {currentItem.fileType || 'Unknown format'}
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        {items.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Metadata Bottom Panel / Drawer */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl px-6 py-4 z-20"
          >
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
              
              {/* Group 1: Verified vs Inferred Date */}
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-zinc-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">
                      {formatDate(currentItem.captureDate) || 'Date unknown'}
                    </span>
                    {currentItem.isVerifiedMetadata ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        <CheckCircle2 size={10} /> Verified EXIF
                      </span>
                    ) : currentItem.captureDate ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        Inferred ({currentItem.captureDateSource || 'file'})
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-white/10 uppercase">
                        Unknown
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 2: Location Information */}
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-zinc-400 shrink-0" />
                <div className="flex items-center gap-1.5">
                  {currentItem.gps ? (
                    <>
                      <span className="font-semibold text-white">
                        {currentItem.gps.latitude.toFixed(4)}°, {currentItem.gps.longitude.toFixed(4)}°
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        <CheckCircle2 size={10} /> GPS Coordinates
                      </span>
                    </>
                  ) : currentItem.locationName ? (
                    <>
                      <span className="font-semibold text-white">{currentItem.locationName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        Inferred
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-500 italic">Location unknown</span>
                  )}
                </div>
              </div>

              {/* Group 3: Camera / Source */}
              {(currentItem.cameraMake || currentItem.cameraModel) && (
                <div className="flex items-center gap-2">
                  <Camera size={15} className="text-zinc-400 shrink-0" />
                  <span className="text-zinc-300 font-medium">
                    {[currentItem.cameraMake, currentItem.cameraModel].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}

              {/* Group 4: File Details */}
              <div className="flex items-center gap-3 text-zinc-400">
                {currentItem.dimensions?.width > 0 && (
                  <span>
                    {currentItem.dimensions.width} × {currentItem.dimensions.height}
                  </span>
                )}
                <span>{formatFileSize(currentItem.fileSize)}</span>
                {currentItem.folderName && (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                    Folder: {currentItem.folderName}
                  </span>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
