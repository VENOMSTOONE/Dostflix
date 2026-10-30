import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Shuffle, Sparkles, Move, Film } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import PolaroidCard from '../components/cards/PolaroidCard';
import soundFx from '../utils/soundFx';

const ALL_MOMENTS = [
  { id: '1', file: 'WhatsApp Image 2026-07-30 at 6.42.12 PM.jpeg', title: 'Retro Photo Booth Chaos', location: 'Retro Arcade', date: 'June 2026' },
  { id: '2', file: 'WhatsApp Image 2026-07-30 at 6.42.13 PM.jpeg', title: 'Postcards from Udaipur', location: 'Udaipur', date: 'May 2026' },
  { id: '3', file: 'WhatsApp Image 2026-07-30 at 6.42.14 PM.jpeg', title: 'Dosa Feast & Squad Talks', location: 'Dosa Cafe', date: 'July 2026' },
  { id: '4', file: 'WhatsApp Image 2026-07-30 at 6.42.14 PM (1).jpeg', title: 'Late Night Grind & Code Sesh', location: 'Home Office', date: 'July 2026' },
  { id: '5', file: 'WhatsApp Image 2026-07-30 at 6.42.15 PM.jpeg', title: 'Late Night Screen Glows', location: 'Home Office', date: 'June 2026' },
  { id: '6', file: 'WhatsApp Image 2026-07-30 at 6.42.15 PM (1).jpeg', title: 'Late Night Banter', location: 'Home Office', date: 'June 2026' },
  { id: '7', file: 'WhatsApp Image 2026-07-30 at 6.42.16 PM.jpeg', title: 'Ice Cream Hangout', location: 'Naturals', date: 'July 2026' },
  { id: '8', file: 'WhatsApp Image 2026-07-30 at 6.42.17 PM.jpeg', title: 'Ice Cream Cravings', location: 'Ice Cream Parlor', date: 'July 2026' },
  { id: '9', file: 'WhatsApp Image 2026-07-30 at 6.42.18 PM.jpeg', title: 'Late Night Squad Call', location: 'Home Office', date: 'June 2026' },
  { id: '10', file: 'WhatsApp Image 2026-07-30 at 6.42.19 PM.jpeg', title: 'Dinner Run & Laughs', location: 'Dosa Cafe', date: 'July 2026' },
];

export default function Keepsakes() {
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';
  const containerRef = useRef(null);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'gallery'
  const [selectedMoments, setSelectedMoments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [cardWidth, setCardWidth] = useState(200);

  const getBalancedPositions = (count) => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isMobile = w < 640;
    const isTablet = w >= 640 && w < 1024;

    if (isMobile) {
      // 5 slots arranged in a compact staggered cluster
      return [
        { x: -65, y: -90, rotate: -7 },
        { x: 65, y: -80, rotate: 6 },
        { x: 0, y: 15, rotate: -3 },
        { x: -65, y: 110, rotate: 5 },
        { x: 65, y: 115, rotate: -6 },
      ].slice(0, count);
    }

    if (isTablet) {
      // 2 rows of 3 and 2
      return [
        { x: -220, y: -70, rotate: -8 },
        { x: 0, y: -80, rotate: 3 },
        { x: 220, y: -65, rotate: 7 },
        { x: -110, y: 80, rotate: 5 },
        { x: 110, y: 75, rotate: -6 },
      ].slice(0, count);
    }

    // Desktop: 5 horizontal scattered positions across the wide board
    const desktopSlots = [
      { x: -360, y: -25, rotate: -8 },
      { x: -180, y: 35, rotate: 5 },
      { x: 0, y: -50, rotate: -3 },
      { x: 180, y: 40, rotate: 6 },
      { x: 360, y: -20, rotate: -7 }
    ];

    // Add gentle organic jitter
    return desktopSlots.slice(0, count).map(slot => ({
      x: slot.x + (Math.random() * 20 - 10),
      y: slot.y + (Math.random() * 20 - 10),
      rotate: slot.rotate + (Math.random() * 6 - 3)
    }));
  };

  const drawRandomMoments = () => {
    // Shuffle and pick 5 random moments
    const shuffled = [...ALL_MOMENTS].sort(() => 0.5 - Math.random());
    const count = 5;
    const picked = shuffled.slice(0, count);
    setSelectedMoments(picked);
    setPositions(getBalancedPositions(count));
  };

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setCardWidth(w < 640 ? 150 : w < 1024 ? 180 : 210);
      setPositions(getBalancedPositions(5));
    };

    handleResize();
    drawRandomMoments();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#09090b] min-h-screen text-white px-4 sm:px-8 md:px-12 py-10 md:py-14 select-none relative overflow-x-hidden">
      {/* Cinematic Ambient Glow Header Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[var(--accent)]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] md:text-xs uppercase bg-[var(--accent)]/20 border border-[var(--accent)]/40 text-[var(--accent)] font-extrabold px-2.5 py-0.5 rounded-full tracking-widest flex items-center gap-1.5">
              <Film size={12} /> Keepsake Memory Box
            </span>
            <span className="text-[10px] md:text-xs text-zinc-400 font-medium">
              Physical Impressions
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            {isFriendsTheme ? (
              <span className="font-black tracking-wider">
                K<span className="text-[#e50914] mx-0.5">•</span>E<span className="text-[#2563eb] mx-0.5">•</span>E<span className="text-[#eab308] mx-0.5">•</span>P<span className="text-[#e50914] mx-0.5">•</span>S<span className="text-[#2563eb] mx-0.5">•</span>A<span className="text-[#eab308] mx-0.5">•</span>K<span className="text-[#e50914] mx-0.5">•</span>E<span className="text-[#2563eb] mx-0.5">•</span>S
              </span>
            ) : (
              "Captured Moments & Polaroids"
            )}
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl leading-relaxed">
            Click any polaroid to flip it and reveal the personal memory message on the back. Drag polaroids freely to organize your moments.
          </p>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {viewMode === 'board' && (
            <button
              onClick={() => {
                soundFx.playShuffle();
                drawRandomMoments();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 rounded-xl text-xs font-bold text-[var(--accent)] hover:brightness-110 transition-all active:scale-95 shadow-sm"
              title="Draw 5 new random moments"
            >
              <Shuffle size={14} />
              <span>Shuffle Moments</span>
            </button>
          )}

          <div className="flex bg-zinc-900 border border-white/10 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => {
                soundFx.playPop();
                setViewMode('board');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'board'
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Move size={13} />
              <span>Memory Board</span>
            </button>

            <button
              onClick={() => {
                soundFx.playPop();
                setViewMode('gallery');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'gallery'
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={13} />
              <span>All 10 Polaroids</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="max-w-6xl mx-auto">
        {viewMode === 'board' ? (
          /* Interactive Drag Board */
          <motion.div
            key="board"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            ref={containerRef}
            className="w-full h-[66vh] min-h-[480px] rounded-3xl bg-zinc-950/70 border border-white/10 relative overflow-hidden backdrop-blur-md shadow-2xl flex items-center justify-center"
          >
            {/* Darkroom Grid Dots */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Central Ambient Theme Core */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--accent-glow)_0%,transparent_60%)] opacity-30 pointer-events-none" />

            {/* Floating Helper Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-medium text-zinc-300 pointer-events-none flex items-center gap-2 z-20 shadow-md">
              <Sparkles size={13} className="text-[var(--accent)]" />
              <span>Click polaroid to flip & reveal message &bull; Drag to rearrange</span>
            </div>

            {/* Spread of Random Polaroids */}
            {selectedMoments.map((item, index) => (
              <PolaroidCard
                key={`${item.id}-${index}`}
                item={item}
                isDraggable={true}
                dragConstraints={containerRef}
                initialPos={positions[index]}
                width={cardWidth}
              />
            ))}
          </motion.div>
        ) : (
          /* Curated Gallery Grid of All 10 Moments */
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6 pb-20"
          >
            {ALL_MOMENTS.map((item) => (
              <PolaroidCard
                key={item.id}
                item={item}
                isDraggable={false}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
