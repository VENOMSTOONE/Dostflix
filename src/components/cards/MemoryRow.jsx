import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MemoryCard from './MemoryCard';
import soundFx from '../../utils/soundFx';

export default function MemoryRow({ title, memories, onToggleFavorite, favorites }) {
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollBy = (direction) => {
    soundFx.playSwoosh();
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmt = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  if (!memories.length) return null;

  return (
    <div className="relative group/row my-6 md:my-8 select-none">
      {/* Row Header */}
      <h3 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2 md:mb-3 px-6 md:px-12 drop-shadow-sm flex items-baseline gap-2">
        {title}
        <span className="text-xs font-normal text-zinc-400">({memories.length})</span>
      </h3>

      <div className="relative w-full">
        {/* Left Arrow (Vertically Centered) */}
        {showLeftArrow && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-10 md:w-14 bg-black/80 hover:bg-black/95 text-white flex items-center justify-center z-30 opacity-0 group-hover/row:opacity-100 transition-all duration-300 rounded-r-lg border-y border-r border-white/10 backdrop-blur-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft size={32} className="hover:scale-125 active:scale-95 transition-transform" />
          </button>
        )}

        {/* Right Arrow (Vertically Centered) */}
        {showRightArrow && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-10 md:w-14 bg-black/80 hover:bg-black/95 text-white flex items-center justify-center z-30 opacity-0 group-hover/row:opacity-100 transition-all duration-300 rounded-l-lg border-y border-l border-white/10 backdrop-blur-sm"
            aria-label="Scroll right"
          >
            <ChevronRight size={32} className="hover:scale-125 active:scale-95 transition-transform" />
          </button>
        )}

        {/* Horizontal Card Runner container */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto px-6 md:px-12 py-3 scrollbar-hide select-none items-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {memories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              isFavorite={favorites.includes(memory.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
