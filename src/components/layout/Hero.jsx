import React, { useState } from 'react';
import { Play, Info, Volume2, VolumeX, MapPin, Users, Calendar, Shuffle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMemories } from '../../context/MemoryContext';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';

export default function Hero({ featuredMemory, onShuffle }) {
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { collections } = useMemories();
  const isFriendsTheme = currentTheme?.id === 'friends';

  if (!featuredMemory) return null;

  // Find if there is a video in the featured memory's assets
  const videoAsset = featuredMemory.assets?.find(asset => asset.endsWith('.mp4'));
  const collection = (collections || []).find(c => c.id === featuredMemory.collectionId);

  const formattedDate = featuredMemory.date
    ? new Date(featuredMemory.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '2026';

  return (
    <div className="relative h-[82vh] md:h-[90vh] w-full overflow-hidden bg-black select-none">
      {/* Background Media with AnimatePresence on memory change */}
      <div className="absolute inset-0 w-full h-full">
        {videoAsset ? (
          <video
            key={featuredMemory.id}
            src={videoAsset}
            className="w-full h-full object-cover scale-105 pointer-events-none brightness-[0.55] saturate-[0.9] transition-all duration-700"
            autoPlay
            muted={isMuted}
            loop
            playsInline
          />
        ) : (
          <img
            key={featuredMemory.id}
            src={featuredMemory.thumbnail}
            alt={featuredMemory.title}
            className="w-full h-full object-cover scale-105 pointer-events-none brightness-[0.55] saturate-[0.9] transition-all duration-700"
          />
        )}
        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute bottom-[8%] md:bottom-[14%] left-0 w-full max-w-4xl z-10 px-6 md:px-12">
        <motion.div
          key={`content-${featuredMemory.id}`}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3"
        >
          {/* Top Badges: Category & Format */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] md:text-xs uppercase bg-[var(--accent)] text-white font-extrabold px-2.5 py-0.5 rounded tracking-widest shadow-md">
              Featured Story
            </span>
            {isFriendsTheme && (
              <span className="text-[10px] md:text-xs uppercase bg-[#eab308]/20 text-[#facc15] font-black px-2.5 py-0.5 rounded tracking-widest border border-[#eab308]/50 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] animate-ping" />
                <span>Central Perk Episode</span>
              </span>
            )}
            {collection && (
              <span className="text-[10px] md:text-xs uppercase bg-white/10 text-zinc-300 font-semibold px-2.5 py-0.5 rounded tracking-wider backdrop-blur-md border border-white/10">
                {collection.title}
              </span>
            )}
            <span className="text-[10px] md:text-xs uppercase bg-zinc-900/80 text-[var(--accent)] font-bold px-2 py-0.5 rounded border border-[var(--accent)]/30">
              {videoAsset ? '4K Video Story' : 'Photo Gallery'}
            </span>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight">
            {featuredMemory.title}
          </h2>

          {/* Detailed Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm font-semibold text-zinc-300 py-1">
            <span className="text-emerald-400 font-bold">99% Match</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-[var(--accent)]" />
              {formattedDate}
            </span>
            <span className="text-zinc-600">&bull;</span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-[var(--accent)]" />
              {featuredMemory.location}
            </span>
            <span className="text-zinc-600">&bull;</span>
            <span className="capitalize text-zinc-300 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              {featuredMemory.mood} mood
            </span>
            {featuredMemory.people && featuredMemory.people.length > 0 && (
              <>
                <span className="text-zinc-600">&bull;</span>
                <span className="flex items-center gap-1 text-zinc-200">
                  <Users size={13} className="text-blue-400" />
                  With {featuredMemory.people.join(' & ')}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm md:text-base text-zinc-300 max-w-2xl font-light line-clamp-3 leading-relaxed drop-shadow-md">
            {featuredMemory.description}
          </p>

          {/* Tags Row */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {featuredMemory.tags?.map(tag => (
              <span
                key={tag}
                className="text-[10px] md:text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-zinc-300 px-2.5 py-0.5 rounded-full font-medium transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-4">
            <button
              onClick={() => {
                soundFx.playTudum();
                navigate(`/memory/${featuredMemory.id}?play=true`);
              }}
              className="flex items-center gap-2.5 bg-white text-black font-bold px-6 md:px-8 py-3 rounded-full hover:bg-[var(--accent)] hover:text-white transition-all duration-300 transform active:scale-95 shadow-xl hover:shadow-[0_0_25px_var(--accent-glow)] text-sm md:text-base"
            >
              <Play size={18} fill="currentColor" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => {
                soundFx.playPop();
                navigate(`/memory/${featuredMemory.id}`);
              }}
              className="flex items-center gap-2 bg-white/15 text-white border border-white/20 font-semibold px-5 md:px-6 py-3 rounded-full hover:bg-white/25 transition-all duration-300 backdrop-blur-md active:scale-95 text-sm md:text-base"
            >
              <Info size={18} />
              <span>More Info</span>
            </button>

            {onShuffle && (
              <button
                onClick={() => {
                  soundFx.playShuffle();
                  onShuffle();
                }}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/70 text-zinc-300 hover:text-white border border-white/15 px-4 py-3 rounded-full transition-all backdrop-blur-md active:scale-95 text-xs font-semibold"
                title="Shuffle featured memory"
              >
                <Shuffle size={15} />
                <span className="hidden sm:inline">Next Story</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Floating Audio Toggle for Video - Bottom Right */}
      {videoAsset && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            soundFx.playClick();
            setIsMuted(!isMuted);
          }}
          className="absolute bottom-[20%] right-[6%] p-3 rounded-full border border-white/20 bg-black/50 hover:bg-black/80 hover:scale-105 active:scale-95 transition-all text-white backdrop-blur-md z-10 shadow-lg"
          title={isMuted ? "Unmute Hero Video" : "Mute Hero Video"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </motion.button>
      )}
    </div>
  );
}
