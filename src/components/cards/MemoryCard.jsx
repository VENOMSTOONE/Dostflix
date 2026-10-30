import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Heart, MapPin, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import soundFx from '../../utils/soundFx';

export default function MemoryCard({
  memory,
  onToggleFavorite,
  isFavorite
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const cardRef = useRef(null);
  const hoverTimeout = useRef(null);
  const closeTimeout = useRef(null);
  const navigate = useNavigate();

  const videoAsset = memory.assets?.find(asset => asset.endsWith('.mp4'));

  const handleMouseEnter = () => {
    soundFx.playHover();
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setCardRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        setIsHovered(true);
      }
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    closeTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 220);
  };

  const handlePortalMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  const handlePortalMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setIsHovered(false);
    }, 220);
  };

  // Close preview immediately if user scrolls page or window
  useEffect(() => {
    if (!isHovered) return;
    const handleScroll = () => {
      setIsHovered(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHovered]);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  // Compute portal card dimensions & boundaries
  let portalStyle = {};
  if (cardRect) {
    const targetWidth = Math.min(window.innerWidth - 32, Math.max(300, cardRect.width * 1.35));
    let left = cardRect.left - (targetWidth - cardRect.width) / 2;
    // Keep within horizontal screen bounds
    left = Math.max(16, Math.min(window.innerWidth - targetWidth - 16, left));

    let top = cardRect.top - 24;
    // Keep within vertical screen bounds (estimated expanded card height ~360px)
    if (top + 360 > window.innerHeight) {
      top = Math.max(16, window.innerHeight - 380);
    } else {
      top = Math.max(16, top);
    }

    portalStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${targetWidth}px`,
      zIndex: 99999
    };
  }

  return (
    <>
      {/* Static In-Row Card */}
      <div
        ref={cardRef}
        className="relative flex-none w-[190px] sm:w-[260px] md:w-[280px] aspect-video z-10 select-none cursor-pointer rounded-lg overflow-hidden bg-zinc-900 border border-white/5 group/card transition-all duration-300 hover:border-white/20"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          soundFx.playPop();
          navigate(`/memory/${memory.id}`);
        }}
      >
        <img
          src={memory.thumbnail}
          alt={memory.title}
          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 brightness-[0.85] group-hover/card:brightness-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-2.5 sm:p-3">
          <h4 className="text-xs sm:text-sm font-semibold truncate text-white drop-shadow-md tracking-wide">
            {memory.title}
          </h4>
        </div>
      </div>

      {/* Top-Level Portal: Elevates directly into document.body on top of EVERYTHING */}
      {isHovered && cardRect && createPortal(
        <AnimatePresence>
          <div
            style={portalStyle}
            onMouseEnter={handlePortalMouseEnter}
            onMouseLeave={handlePortalMouseLeave}
            className="relative pointer-events-auto select-none"
          >
            {/* Subtle, Refined Ambient Accent Backglow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="absolute -inset-3 bg-[var(--accent)]/20 rounded-3xl blur-xl pointer-events-none -z-10"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full rounded-2xl overflow-hidden bg-zinc-950/95 backdrop-blur-2xl border border-white/15 hover:border-[var(--accent)]/40 shadow-[0_0_25px_var(--accent-glow),0_20px_50px_rgba(0,0,0,0.95)] flex flex-col select-none group/portal"
            >
              {/* Media Block (Video or Image) */}
            <div className="relative w-full aspect-video overflow-hidden bg-black">
              {videoAsset ? (
                <video
                  src={videoAsset}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                />
              ) : (
                <img
                  src={memory.thumbnail}
                  alt={memory.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Media Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />

              {/* Volume Toggle for Video */}
              {videoAsset && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playClick();
                    setIsMuted(!isMuted);
                  }}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all z-10"
                  title={isMuted ? "Unmute Preview" : "Mute Preview"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              )}
            </div>

            {/* Netflix-Style Details Drawer with Optimal Padding */}
            <div className="p-4 sm:p-5 flex flex-col gap-3 bg-zinc-950">
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playTudum();
                      navigate(`/memory/${memory.id}?play=true`);
                    }}
                    title="Play Memory"
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-all transform active:scale-90 shadow-lg"
                  >
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playFavorite(!isFavorite);
                      onToggleFavorite(memory.id);
                    }}
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all transform active:scale-90 ${
                      isFavorite
                        ? 'text-[var(--accent)] border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_0_12px_var(--accent-glow)]'
                        : 'border-white/30 text-white/80 hover:border-white hover:text-white bg-white/5'
                    }`}
                  >
                    <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playPop();
                    navigate(`/memory/${memory.id}`);
                  }}
                  title="More Information"
                  className="w-9 h-9 rounded-full border border-white/30 text-white/80 hover:border-white hover:text-white bg-white/5 flex items-center justify-center transition-all transform active:scale-90"
                >
                  <Info size={16} />
                </button>
              </div>

              {/* Netflix Metadata Badges */}
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <span className="text-emerald-400 font-bold tracking-wide">98% Match</span>
                <span className="border border-white/30 text-white/80 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                  {memory.mediaType === 'mixed' ? 'Video' : 'HD'}
                </span>
                <span className="text-zinc-400 font-medium">
                  {memory.date ? new Date(memory.date).getFullYear() : '2026'}
                </span>
                <span className="text-zinc-600">&bull;</span>
                <span className="text-zinc-300 capitalize font-medium">
                  {memory.mood}
                </span>
              </div>

              {/* Title & Story Snippet */}
              <div className="flex flex-col gap-1">
                <h4 className="text-sm sm:text-base font-black text-white tracking-wide truncate">
                  {memory.title}
                </h4>
                {memory.description && (
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-light">
                    {memory.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                  <MapPin size={12} className="text-[var(--accent)] flex-shrink-0" />
                  <span className="truncate">{memory.location}</span>
                </div>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {memory.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] bg-white/10 border border-white/10 text-zinc-300 px-2 py-0.5 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
