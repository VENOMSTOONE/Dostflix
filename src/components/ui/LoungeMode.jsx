import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Maximize2, Minimize2, MapPin, Calendar, Sparkles } from 'lucide-react';
import { useMemories } from '../../context/MemoryContext';
import { useTheme } from '../../context/ThemeContext';
import { useMusic } from '../../context/AudioContext';
import soundFx from '../../utils/soundFx';

export default function LoungeMode({ isOpen, onClose }) {
  const { memories, isFriendsTheme } = useMemories();
  const { currentTheme } = useTheme();
  const { isPlaying, toggleMusic, resumeMusic, isMuted, toggleMute } = useMusic();

  // Extract all memories that have photo imagery
  const slides = React.useMemo(() => {
    return (memories || []).filter(m => m.thumbnail || (m.assets && m.assets.length > 0));
  }, [memories]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // When Lounge Mode opens, gently start soundtrack if paused
  useEffect(() => {
    if (isOpen) {
      if (!isPlaying) {
        resumeMusic();
      }
      soundFx.playPop();
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (!slides.length) return;
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    if (!slides.length) return;
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Slideshow auto-advance every 7.5 seconds
  useEffect(() => {
    if (!isOpen || isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, 7500);
    return () => clearInterval(timer);
  }, [isOpen, isPaused, handleNext, slides.length]);

  // Keyboard navigation (Esc to exit, Arrow keys, Space to pause)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  if (!isOpen || !slides.length) return null;

  const currentSlide = slides[currentIndex];
  // Select best photo from memory assets
  const photoUrl = currentSlide?.assets?.find(a => !a.endsWith('.mp4')) || currentSlide?.thumbnail;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[200] bg-black text-white select-none overflow-hidden flex flex-col justify-between"
      >
        {/* Background Ken Burns Photo Display */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={`slide-${currentSlide.id}-${currentIndex}`}
              initial={{ opacity: 0, scale: 1 }}
              animate={{
                opacity: 1,
                scale: 1.08,
                x: currentIndex % 2 === 0 ? 15 : -15,
                y: currentIndex % 3 === 0 ? 8 : -8
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.2 },
                scale: { duration: 8, ease: 'linear' },
                x: { duration: 8, ease: 'linear' },
                y: { duration: 8, ease: 'linear' }
              }}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${photoUrl}")`,
                filter: 'brightness(0.82) contrast(1.05)'
              }}
            />
          </AnimatePresence>

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/70 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />
        </div>

        {/* Top Lounge HUD Bar */}
        <div className="relative z-10 p-6 md:p-8 flex items-center justify-between">
          {/* Logo & Lounge Tag */}
          <div className="flex items-center gap-3">
            {isFriendsTheme ? (
              <h2 className="text-xl md:text-2xl font-black font-mono tracking-widest text-white drop-shadow-md">
                D<span className="text-[#e50914]">•</span>O<span className="text-[#2563eb]">•</span>S<span className="text-[#eab308]">•</span>T<span className="text-[#e50914]">•</span>F<span className="text-[#2563eb]">•</span>L<span className="text-[#eab308]">•</span>I<span className="text-[#e50914]">•</span>X
              </h2>
            ) : (
              <h2 className="text-xl md:text-2xl font-black text-[var(--accent)] tracking-tight drop-shadow-md">
                DostFlix
              </h2>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] md:text-xs font-bold uppercase tracking-wider text-zinc-200">
              <Sparkles size={12} className="text-[var(--accent)] animate-pulse" />
              <span>Lounge Ambient Mode</span>
            </div>
          </div>

          {/* Right Controls: Clock, Sound, Play/Pause, Fullscreen, Close */}
          <div className="flex items-center gap-2.5 md:gap-4">
            {/* Live Ambient Digital Clock */}
            <div className="hidden sm:flex flex-col items-end pr-2 border-r border-white/15">
              <span className="text-base md:text-lg font-black font-mono tracking-wider leading-none text-white drop-shadow">
                {timeStr}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">
                {dateStr}
              </span>
            </div>

            {/* Mute/Sound Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute Soundtrack" : "Mute Soundtrack"}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white transition-all active:scale-95 shadow-md"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Slideshow Auto-Play / Pause Toggle */}
            <button
              onClick={() => setIsPaused(p => !p)}
              title={isPaused ? "Resume Slideshow" : "Pause Slideshow"}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white transition-all active:scale-95 shadow-md"
            >
              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white transition-all active:scale-95 shadow-md"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Exit Lounge Mode (Esc)"
              className="p-2.5 rounded-full bg-red-600/80 hover:bg-red-600 backdrop-blur-md text-white transition-all active:scale-95 shadow-md ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Center Nav Arrows (Hover Reveal) */}
        <div className="relative z-10 px-4 md:px-8 flex justify-between pointer-events-none">
          <button
            onClick={handlePrev}
            title="Previous memory"
            className="pointer-events-auto p-3 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 hover:scale-110 shadow-xl opacity-60 hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            title="Next memory"
            className="pointer-events-auto p-3 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all active:scale-90 hover:scale-110 shadow-xl opacity-60 hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Bottom Ambient Memory Card */}
        <div className="relative z-10 p-6 md:p-10 max-w-4xl">
          <motion.div
            key={`info-${currentSlide.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.8)] flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Subtle Accent Glow Line at top */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(to right, transparent, ${currentTheme.colors.accent}, transparent)`
              }}
            />

            {/* Badge & Metadata Strip */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow"
                style={{ backgroundColor: currentTheme.colors.accent }}
              >
                Memory {currentIndex + 1} of {slides.length}
              </span>

              {currentSlide.location && (
                <span className="flex items-center gap-1 font-medium bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  <MapPin size={11} className="text-[var(--accent)]" />
                  <span>{currentSlide.location}</span>
                </span>
              )}

              {currentSlide.date && (
                <span className="flex items-center gap-1 font-medium bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  <Calendar size={11} className="text-[var(--accent)]" />
                  <span>{currentSlide.date}</span>
                </span>
              )}

              {/* Tagged Friends */}
              {currentSlide.people && (
                <div className="flex items-center gap-1.5 ml-auto">
                  {currentSlide.people.map(p => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Memory Title */}
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow">
              {currentSlide.title}
            </h1>

            {/* Description */}
            <p className="text-xs md:text-sm text-zinc-300 font-light leading-relaxed max-w-2xl line-clamp-2">
              {currentSlide.description}
            </p>

            {/* Progress Bar of current slide timer */}
            {!isPaused && (
              <motion.div
                key={`progress-${currentIndex}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 7.5, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-1 origin-left"
                style={{ backgroundColor: currentTheme.colors.accent }}
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
