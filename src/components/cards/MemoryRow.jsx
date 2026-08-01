import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MemoryCard from './MemoryCard';

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
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmt = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmt, behavior: 'smooth' });
    }
  };

  if (!memories.length) return null;

  return (
    <div className="relative group/row mt-12 md:mt-24 mb-6 md:mb-12 select-none z-10 hover:z-50 focus-within:z-50">
      <h3 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2 md:mb-4 px-6 md:px-12 drop-shadow-sm font-sans flex items-baseline gap-2">
        {title}
        <span className="text-xs font-normal text-primary/40">({memories.length})</span>
      </h3>

      <div className="relative w-full overflow-visible">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-0 bottom-6 w-12 md:w-16 bg-gradient-to-r from-black via-black/80 to-transparent hover:via-black/95 text-white flex items-center justify-center z-20 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 pointer-events-auto"
          >
            <ChevronLeft size={36} className="hover:scale-110 active:scale-95 transition-transform" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-0 bottom-6 w-12 md:w-16 bg-gradient-to-l from-black via-black/80 to-transparent hover:via-black/95 text-white flex items-center justify-center z-20 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 pointer-events-auto"
          >
            <ChevronRight size={36} className="hover:scale-110 active:scale-95 transition-transform" />
          </button>
        )}

        {/* Horizontal Card Runner container */}
        <div
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto overflow-y-visible px-6 md:px-12 py-12 -my-12 scrollbar-hide select-none"
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
