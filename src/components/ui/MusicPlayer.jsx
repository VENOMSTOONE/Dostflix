import React, { useState } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, ChevronUp, ChevronDown, RotateCcw, RotateCw } from 'lucide-react';
import { useMusic } from '../../context/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import soundFx from '../../utils/soundFx';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds <= 0 || !Number.isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function MusicPlayer() {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    toggleMusic,
    seek,
    skip,
    setVolume,
    toggleMute,
    currentTrack
  } = useMusic();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  const displayTime = isDragging ? dragTime : currentTime;
  const validDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const progressPercent = validDuration > 0 ? Math.min(100, Math.max(0, (displayTime / validDuration) * 100)) : 0;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] select-none">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* Collapsed Floating Pill */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 bg-zinc-950/85 backdrop-blur-xl border border-white/10 p-2.5 pl-3 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-[var(--accent)]/50 transition-all group"
          >
            {/* Spinning Vinyl / Music Icon */}
            {/* Spinning Vinyl / Music Icon */}
            <div
              onClick={() => {
                soundFx.playClick();
                toggleMusic();
              }}
              title={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
              className={`p-2 rounded-full cursor-pointer transition-transform duration-300 ${
                isPlaying
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)] scale-105'
                  : 'bg-white/10 text-white/80 group-hover:text-white'
              }`}
            >
              <Music size={16} className={isPlaying ? 'animate-spin-slow' : ''} />
            </div>

            {/* Title & Live Sound Equalizer */}
            <div
              onClick={() => {
                soundFx.playPop();
                setIsExpanded(true);
              }}
              className="flex items-center gap-3 cursor-pointer pr-1"
            >
              <div className="flex flex-col min-w-0 max-w-[130px]">
                <div className="flex items-center gap-1.5">
                  {currentTrack?.id === 'friends' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-white tracking-wide leading-tight truncate">
                    {currentTrack?.title || 'DostFlix Soundtrack'}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-400 font-medium truncate">
                  {isPlaying
                    ? `${formatTime(currentTime)} / ${formatTime(validDuration)}`
                    : (currentTrack?.artist || 'Click to Play')}
                </span>
              </div>

              {/* Animated Waveform Bars */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3.5 px-1">
                  {[10, 14, 8, 12].map((height, i) => (
                    <motion.span
                      key={i}
                      animate={{ height: [3, height, 3] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut'
                      }}
                      className="w-0.5 bg-[var(--accent)] rounded-full inline-block"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Play/Pause Action */}
            <button
              onClick={() => {
                soundFx.playClick();
                toggleMusic();
              }}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isPlaying ? <Pause size={13} className="text-[var(--accent)]" /> : <Play size={13} fill="currentColor" />}
            </button>

            {/* Expand Action */}
            <button
              onClick={() => {
                soundFx.playPop();
                setIsExpanded(true);
              }}
              aria-label="Expand player controls"
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronUp size={16} />
            </button>
          </motion.div>
        ) : (
          /* Expanded Mini Audio Dock */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-80 sm:w-88 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 shadow-[0_12px_48px_rgba(0,0,0,0.8)] flex flex-col gap-3.5"
          >
            {/* Header: Track Info & Minimize */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isPlaying ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30' : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  <Music size={18} className={isPlaying ? 'animate-spin-slow' : ''} />
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-xs font-bold text-white truncate tracking-wide">
                    {currentTrack?.title || 'DostFlix Original Soundtrack'}
                  </h4>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {currentTrack?.subtitle || 'Ambient Memories • Lo-fi Vibes'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsExpanded(false);
                }}
                aria-label="Collapse player"
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Special Badge if Friends Theme Song */}
            {currentTrack?.id === 'friends' && (
              <div
                onClick={() => soundFx.playClap()}
                title="Click for the iconic 4 claps!"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[10px] text-purple-300 cursor-pointer hover:bg-purple-900/40 hover:border-purple-500/40 transition-all select-none group"
              >
                <span className="flex items-center gap-1 font-bold group-hover:scale-105 transition-transform">
                  <span>F</span><span className="text-red-500">•</span>
                  <span>R</span><span className="text-blue-500">•</span>
                  <span>I</span><span className="text-yellow-500">•</span>
                  <span>E</span><span className="text-red-500">•</span>
                  <span>N</span><span className="text-yellow-500">•</span>
                  <span>D</span><span className="text-blue-500">•</span>
                  <span>S</span>
                </span>
                <span className="text-purple-300/80 font-mono flex items-center gap-1">
                  <span>Central Perk OST</span>
                  <span className="text-xs">👏</span>
                </span>
              </div>
            )}

            {/* Progress Timeline & Scrubber */}
            <div className="flex flex-col gap-1">
              <div className="relative w-full flex items-center group/slider">
                <input
                  type="range"
                  min="0"
                  max={validDuration || 100}
                  step="0.1"
                  value={displayTime}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setDragTime(val);
                    if (!isDragging) {
                      seek(val);
                    }
                  }}
                  onMouseUp={(e) => {
                    seek(parseFloat(e.target.value));
                    setIsDragging(false);
                  }}
                  onTouchEnd={() => {
                    seek(dragTime);
                    setIsDragging(false);
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)] transition-all"
                  style={{
                    background: `linear-gradient(to right, var(--accent) ${progressPercent}%, #27272a ${progressPercent}%)`
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                <span>{formatTime(displayTime)}</span>
                <span>{formatTime(validDuration)}</span>
              </div>
            </div>

            {/* Controls Row: Volume, Skips, Play/Pause */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              {/* Volume Slider & Mute Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    toggleMute();
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  style={{
                    background: `linear-gradient(to right, var(--accent) ${(isMuted ? 0 : volume) * 100}%, #27272a ${(isMuted ? 0 : volume) * 100}%)`
                  }}
                />
              </div>

              {/* Playback Controls: Rewind 10s, Play/Pause, Forward 10s */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    skip(-10);
                  }}
                  title="Rewind 10 seconds"
                  aria-label="Rewind 10 seconds"
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors active:scale-90"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    toggleMusic();
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent)] text-white hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_var(--accent-glow)]"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick();
                    skip(10);
                  }}
                  title="Skip forward 10 seconds"
                  aria-label="Skip forward 10 seconds"
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors active:scale-90"
                >
                  <RotateCw size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
