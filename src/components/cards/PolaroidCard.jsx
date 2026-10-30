import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, MapPin, Check } from 'lucide-react';
import soundFx from '../../utils/soundFx';

export default function PolaroidCard({
  item,
  isDraggable = false,
  dragConstraints = null,
  initialPos = null,
  width = 210
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [note, setNote] = useState(() => localStorage.getItem(`DostFlix_note_${item.file}`) || '');
  const [savedStatus, setSavedStatus] = useState(false);
  const isDragging = useRef(false);

  useEffect(() => {
    localStorage.setItem(`DostFlix_note_${item.file}`, note);
    if (note) {
      setSavedStatus(true);
      const t = setTimeout(() => setSavedStatus(false), 1500);
      return () => clearTimeout(t);
    }
  }, [note, item.file]);

  const handleClick = () => {
    if (!isDragging.current) {
      soundFx.playShutter();
      setIsFlipped(prev => !prev);
    }
  };

  const cardContent = (
    <motion.div
      className="w-full h-full relative cursor-pointer select-none"
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
      onClick={handleClick}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Front Face (Classic Glossy Polaroid Photo) */}
      <div
        className="absolute inset-0 bg-zinc-50 rounded-xl p-3 pb-5 shadow-[0_15px_35px_rgba(0,0,0,0.85)] border border-white/30 flex flex-col items-center justify-between group/front hover:shadow-[0_20px_45px_var(--accent-glow)] transition-shadow duration-300"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(0deg) translateZ(1px)',
          pointerEvents: isFlipped ? 'none' : 'auto'
        }}
      >
        {/* Subtle Tape Accent */}
        <div className="w-12 h-3.5 bg-white/40 -mt-4 mb-1 rounded-sm backdrop-blur-sm shadow-sm border border-black/10 rotate-[-2deg]" />

        {/* Square Photo Window */}
        <div className="w-full aspect-square bg-zinc-950 rounded-lg overflow-hidden relative shadow-inner">
          <img
            src={`/Polaroids/${item.file}`}
            alt={item.title}
            onError={(e) => {
              if (!e.target.dataset.tried) {
                e.target.dataset.tried = 'true';
                e.target.src = `/Polaroids/${encodeURIComponent(item.file)}`;
              }
            }}
            className="w-full h-full object-cover pointer-events-none group-hover/front:scale-105 transition-transform duration-500"
            draggable={false}
          />
          {/* Flip Prompt Badge */}
          <div className="absolute bottom-2 right-2 bg-black/75 hover:bg-[var(--accent)] text-white p-1.5 rounded-full backdrop-blur-md transition-colors shadow flex items-center gap-1 text-[10px] px-2 font-medium">
            <RotateCw size={11} />
            <span>Flip</span>
          </div>
        </div>

        {/* Polaroid Handwritten Style Caption */}
        <div className="w-full mt-2.5 px-1 flex flex-col items-center text-center">
          <h4 className="font-bold text-zinc-950 text-xs sm:text-sm tracking-wide truncate max-w-full">
            {item.title}
          </h4>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium mt-0.5">
            {item.location && (
              <span className="flex items-center gap-0.5">
                <MapPin size={10} className="text-[var(--accent)]" />
                {item.location}
              </span>
            )}
            {item.date && <span>&bull; {item.date}</span>}
          </div>
        </div>
      </div>

      {/* Back Face (Vintage Cream Notepad) */}
      <div
        className="absolute inset-0 bg-[#fdfaf5] rounded-xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.85)] border border-amber-200/90 flex flex-col justify-between"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg) translateZ(1px)',
          pointerEvents: !isFlipped ? 'none' : 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amber-200/70 pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" />
            <span>Memory Message</span>
          </div>
          <button
            onClick={() => setIsFlipped(false)}
            className="p-1 rounded-full hover:bg-amber-200/60 text-amber-900 transition-colors"
            title="Flip to Photo"
          >
            <RotateCw size={13} />
          </button>
        </div>

        <textarea
          className="w-full flex-grow bg-transparent text-zinc-800 text-xs resize-none outline-none leading-relaxed font-serif placeholder:text-zinc-400 placeholder:italic p-1"
          placeholder="Write a message or note about this moment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center justify-between text-[10px] text-amber-900/70 pt-2 border-t border-amber-200/60 font-sans">
          <button
            onClick={() => setIsFlipped(false)}
            className="text-[var(--accent)] hover:brightness-110 font-bold"
          >
            &larr; View Photo
          </button>
          {savedStatus ? (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <Check size={11} /> Saved
            </span>
          ) : (
            <span className="text-zinc-400">Notes auto-saved</span>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isDraggable) {
    return (
      <motion.div
        drag
        dragConstraints={dragConstraints}
        onDragStart={() => {
          isDragging.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDragging.current = false;
          }, 120);
        }}
        initial={initialPos || { x: 0, y: 0, rotate: 0 }}
        animate={initialPos ? { x: initialPos.x, y: initialPos.y, rotate: initialPos.rotate } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        whileDrag={{ scale: 1.08, zIndex: 100, rotate: 0 }}
        className="absolute perspective-1000"
        style={{
          width: `${width}px`,
          height: `${width * 1.34}px`
        }}
      >
        {cardContent}
      </motion.div>
    );
  }

  // Grid Mode (Static Interactive)
  return (
    <div
      className="perspective-1000 w-full aspect-[3.2/4.2] min-h-[260px] relative group/gridcard hover:-translate-y-1 transition-transform duration-200"
    >
      {cardContent}
    </div>
  );
}
