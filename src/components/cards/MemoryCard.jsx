import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MemoryCard({ memory, onToggleFavorite, isFavorite }) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef(null);
  const navigate = useNavigate();

  const videoAsset = memory.assets.find(asset => asset.endsWith('.mp4'));

  const handleMouseEnter = () => {
    // Add 400ms delay before expanding to prevent aggressive popping while scrolling
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
    }, 450);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  };

  useEffect(() => {
    return () => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }
  }, []);

  return (
    <div
      className="relative flex-none w-[170px] sm:w-[260px] aspect-video z-10"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute top-0 left-0 w-full rounded-md bg-surface border border-white/5 shadow-md flex flex-col transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(229,9,20,0.3)]"
        initial={{ scale: 1, zIndex: 10 }}
        animate={{
          scale: isHovered ? 1.22 : 1,
          zIndex: isHovered ? 100 : 10,
          y: isHovered ? -15 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {/* Ambient Backglow */}
        {isHovered && (
          <div className="absolute inset-0 bg-red-600/20 rounded-md blur-xl -z-10 pointer-events-none" />
        )}

        {/* Media Block */}
        <div className="relative w-full aspect-video rounded-t-md overflow-hidden bg-black">
          {isHovered && videoAsset ? (
            <video
              src={videoAsset}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={memory.thumbnail}
              alt={memory.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}

          {/* Title Overlay in Rest State */}
          {!isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2 sm:p-3 transition-opacity">
              <h4 className="text-[11px] sm:text-xs font-semibold truncate text-white drop-shadow-md">
                {memory.title}
              </h4>
            </div>
          )}
        </div>

        {/* Expandable Details Block (Bottom half when hovered) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full bg-surface rounded-b-md shadow-2xl overflow-hidden"
            >
              <div className="p-3 sm:p-4 flex flex-col gap-2 border-t border-white/10">

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/memory/${memory.id}?play=true`); }}
                      className="p-1.5 sm:p-2 bg-white text-black rounded-full hover:bg-accent hover:text-white transition-colors"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(memory.id); }}
                      className={`p-1.5 sm:p-2 rounded-full border transition-colors ${
                        isFavorite ? 'text-accent border-accent/30 bg-accent/10' : 'border-white/40 text-white/70 hover:border-white hover:text-white'
                      }`}
                    >
                      <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/memory/${memory.id}`); }}
                    className="p-1.5 sm:p-2 rounded-full border border-white/40 text-white/70 hover:border-white hover:text-white transition-colors"
                  >
                    <Info size={14} />
                  </button>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="text-[10px] sm:text-xs font-black text-white truncate">{memory.title}</h4>
                  <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] text-primary/60 font-medium mt-0.5">
                    <span className="text-accent font-bold">{memory.date ? new Date(memory.date).getFullYear() : '2026'}</span>
                    <span>&bull;</span>
                    <span className="truncate">{memory.location}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{memory.mood}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {memory.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[7px] sm:text-[9px] bg-white/10 border border-white/10 text-primary/70 px-1 py-0.5 rounded shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
