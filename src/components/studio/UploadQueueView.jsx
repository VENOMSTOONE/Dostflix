import React from 'react';
import { 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function UploadQueueView({
  queue = [],
  isPaused = false,
  onPause,
  onResume,
  onCancel,
  onRetryItem,
  onRemoveItem,
  onAddMore,
  onStartOrganization,
}) {
  const { currentTheme } = useTheme();

  const totalCount = queue.length;
  const completedCount = queue.filter(item => item.status === 'completed').length;
  const errorCount = queue.filter(item => item.status === 'error').length;
  const processingCount = queue.filter(item => item.status === 'processing').length;
  const pendingCount = queue.filter(item => item.status === 'pending').length;

  const totalProgress = totalCount > 0 
    ? Math.round((queue.reduce((acc, item) => acc + (item.progress || 0), 0) / (totalCount * 100)) * 100) 
    : 0;

  const isAllDone = totalCount > 0 && (completedCount + errorCount === totalCount);

  return (
    <div className="w-full bg-zinc-950/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl mt-8">
      {/* Top Header & Global Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${isAllDone ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Upload Queue</span>
              <span className="text-xs font-normal text-zinc-400">
                ({completedCount} of {totalCount} processed)
              </span>
            </h4>
          </div>
          <p className="text-xs text-zinc-400">
            {isAllDone 
              ? 'All files processed and safely stored in your local memory vault.' 
              : `Processing ${processingCount} files with controlled background concurrency...`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAddMore}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
          >
            <Plus size={14} />
            <span>Add More</span>
          </button>

          {!isAllDone && (
            <button
              type="button"
              onClick={() => {
                soundFx.playPop();
                if (isPaused) onResume?.();
                else onPause?.();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
            >
              {isPaused ? <Play size={13} /> : <Pause size={13} />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              onCancel?.();
            }}
            className="px-3 py-1.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-xs font-medium transition-colors"
          >
            Cancel Batch
          </button>
        </div>
      </div>

      {/* Overall Batch Progress Bar */}
      <div className="py-5">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-2">
          <span>Overall Progress: {totalProgress}%</span>
          <span>{completedCount} Done / {errorCount > 0 ? `${errorCount} Failed / ` : ''}{pendingCount + processingCount} Remaining</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${totalProgress}%`,
              backgroundColor: errorCount > 0 && completedCount === 0 ? '#f43f5e' : (currentTheme?.colors?.accent || '#10b981') 
            }}
          />
        </div>
      </div>

      {/* Completion Banner with AI Analysis CTA */}
      <AnimatePresence>
        {isAllDone && completedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">
                  {completedCount} Memories Ready for Intelligent Organization
                </h5>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Let Dostflix analyze timestamps, locations, and folders to suggest grouped memories.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playPop();
                onStartOrganization?.();
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-zinc-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span>Analyze & Organize</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Items List (Max 6 shown at a time with clean scroll) */}
      <div className="max-h-96 overflow-y-auto pr-1 space-y-2.5 no-scrollbar divide-y divide-white/[0.04]">
        {queue.map((item) => {
          const isVideo = item.file?.type?.startsWith('video/') || item.filename?.match(/\.(mp4|mov|webm)$/i);
          const previewThumb = item.result?.thumbnail;

          return (
            <div
              key={item.id}
              className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs"
            >
              {/* Left: Preview + Meta */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Thumbnail / File Icon */}
                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {previewThumb ? (
                    <img src={previewThumb} alt="" className="w-full h-full object-cover" />
                  ) : isVideo ? (
                    <VideoIcon size={18} className="text-zinc-500" />
                  ) : (
                    <ImageIcon size={18} className="text-zinc-500" />
                  )}

                  {/* Status Indicator Dot */}
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-black/80 ${
                    item.status === 'completed' ? 'bg-emerald-400' :
                    item.status === 'processing' ? 'bg-cyan-400 animate-ping' :
                    item.status === 'error' ? 'bg-rose-500' : 'bg-zinc-600'
                  }`} />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                      {item.filename}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      {formatBytes(item.fileSize)}
                    </span>
                    {item.result?.isDuplicate && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium">
                        Duplicate
                      </span>
                    )}
                  </div>

                  {/* Progress / Status String */}
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                    {item.status === 'completed' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Ready in vault</span>
                        {item.result?.captureDate && (
                          <span className="text-zinc-500">
                            • {new Date(item.result.captureDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </span>
                    ) : item.status === 'processing' ? (
                      <span className="text-cyan-400">
                        {item.stage || 'Processing...'} ({item.progress}%)
                      </span>
                    ) : item.status === 'error' ? (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{item.error || 'Failed'}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Queued</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Progress bar & Individual Actions */}
              <div className="flex items-center gap-3 shrink-0">
                {item.status === 'processing' && (
                  <div className="w-16 sm:w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => onRetryItem?.(item.id)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                    title="Retry this file"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveItem?.(item.id)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 transition-colors"
                  title="Remove from queue"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
