import React from 'react';
import { Check, Loader2, Sparkles, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const STAGES = [
  { key: 'reading_files', label: 'Reading uploaded files' },
  { key: 'extracting_metadata', label: 'Extracting metadata' },
  { key: 'visual_fingerprints', label: 'Generating visual fingerprints' },
  { key: 'detecting_duplicates', label: 'Detecting duplicates & bursts' },
  { key: 'analyzing_content', label: 'Analyzing image content' },
  { key: 'grouping_memories', label: 'Grouping related memories' },
  { key: 'preparing_recommendations', label: 'Preparing recommendations' },
];

export default function AnalysisProgressModal({ progress, isVisible = true }) {
  if (!isVisible) return null;

  const percent = Math.min(100, Math.max(0, Math.round(progress?.percent ?? 10)));
  const currentKey = progress?.stageKey || 'reading_files';
  
  // Find current stage index (0 to 6)
  let activeIndex = STAGES.findIndex(s => s.key === currentKey);
  if (activeIndex === -1) {
    activeIndex = progress?.stageIndex != null ? progress.stageIndex : 0;
  }
  if (percent >= 100) {
    activeIndex = STAGES.length;
  }

  const totalFiles = progress?.totalFiles || 0;
  const filesProcessed = progress?.filesProcessed || 0;
  const filesRemaining = Math.max(0, (progress?.filesRemaining ?? (totalFiles - filesProcessed)));
  const currentFile = progress?.currentFile || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-lg bg-[#0d0d12] border border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Subtle top ambient hairline */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase font-mono">
              Dostflix Intelligence
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Analyzing your memories
          </h2>

          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Extracting visual fingerprints, detecting duplicates, and curating cohesive storylines.
          </p>
        </div>

        {/* Stage List */}
        <div className="space-y-2 mb-6">
          {STAGES.map((stage, idx) => {
            const isCompleted = activeIndex > idx || percent >= 100;
            const isCurrent = activeIndex === idx && percent < 100;
            const isPending = activeIndex < idx && percent < 100;

            return (
              <div
                key={stage.key}
                className={`flex items-center justify-between px-3.5 py-2 rounded-xl transition-all duration-200 ${
                  isCurrent 
                    ? 'bg-white/[0.04] border border-white/[0.08]' 
                    : isCompleted
                      ? 'bg-transparent text-zinc-300'
                      : 'bg-transparent text-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    ) : isCurrent ? (
                      <Loader2 size={14} className="text-emerald-400 animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    )}
                  </div>

                  <span className={`text-xs font-medium truncate ${
                    isCurrent ? 'text-white font-semibold' : isCompleted ? 'text-zinc-200' : 'text-zinc-500'
                  }`}>
                    {stage.label}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="shrink-0 text-[10px] font-medium">
                  {isCompleted && (
                    <span className="text-emerald-400/90 font-medium">Completed</span>
                  )}
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold tracking-wide">
                      Processing
                    </span>
                  )}
                  {isPending && (
                    <span className="text-zinc-600">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Metrics & Bar Section */}
        <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
          {/* Top text row: Current file / activity & Percentage */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 truncate max-w-[70%] font-mono text-[11px]" title={currentFile}>
              {currentFile ? (
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-zinc-500 shrink-0" />
                  <span className="truncate">{currentFile}</span>
                </span>
              ) : (
                progress?.stage || 'Processing batch...'
              )}
            </span>
            <span className="font-bold text-white font-mono text-sm">
              {percent}%
            </span>
          </div>

          {/* Clean Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Bottom text row: Real item counts */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
            <span>
              {totalFiles > 0 ? (
                <>
                  <span className="text-zinc-300 font-semibold">{filesProcessed}</span> of{' '}
                  <span className="text-zinc-300 font-semibold">{totalFiles}</span> files processed
                  {filesRemaining > 0 && (
                    <span className="text-zinc-500"> • {filesRemaining} remaining</span>
                  )}
                </>
              ) : (
                'Analyzing media...'
              )}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {percent === 100 ? 'Finalizing' : 'Active'}
            </span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
