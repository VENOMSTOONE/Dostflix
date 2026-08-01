import React, { useState, useEffect } from 'react';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Hero({ featuredMemory }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  if (!featuredMemory) return null;

  // Let's find if there is a video in the featured memory's assets
  const videoAsset = featuredMemory.assets.find(asset => asset.endsWith('.mp4'));

  return (
    <div className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden bg-black select-none">
      {/* Background Media */}
      <div className="absolute inset-0 w-full h-full">
        {videoAsset ? (
          <video
            src={videoAsset}
            className="w-full h-full object-cover scale-105 pointer-events-none brightness-[0.6] saturate-[0.85] transition-all duration-700"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
          />
        ) : (
          <motion.img
            src={featuredMemory.thumbnail}
            alt={featuredMemory.title}
            className="w-full h-full object-cover brightness-[0.55]"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1.02 }}
            transition={{ duration: 15, ease: 'easeOut' }}
          />
        )}

        {/* Ambient Dark Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/10 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-[10%] md:bottom-[15%] left-0 w-full max-w-3xl z-10 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] md:text-xs uppercase bg-accent/20 border border-accent/40 text-accent font-semibold px-2 py-0.5 rounded tracking-widest backdrop-blur-sm">
              Featured Memory
            </span>
            <span className="text-[10px] md:text-xs uppercase bg-white/10 text-white font-medium px-2 py-0.5 rounded tracking-[0.2em] backdrop-blur-sm">
              {featuredMemory.mood}
            </span>
          </div>

          <h2 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
            {featuredMemory.title}
          </h2>

          <p className="text-sm md:text-lg text-primary/80 mb-8 max-w-xl font-light line-clamp-3 leading-relaxed drop-shadow-sm">
            {featuredMemory.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate(`/memory/${featuredMemory.id}?play=true`)}
              className="flex items-center gap-2 bg-white text-black font-semibold px-6 md:px-8 py-3 rounded-full hover:bg-accent hover:text-black transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-accent/20"
            >
              <Play size={20} fill="currentColor" />
              <span className="text-sm md:text-base">Watch Now</span>
            </button>

            <button
              onClick={() => navigate(`/memory/${featuredMemory.id}`)}
              className="flex items-center gap-2 bg-white/15 text-white border border-white/20 font-medium px-6 py-3 rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-md active:scale-95"
            >
              <Info size={20} />
              <span className="text-sm md:text-base">More Info</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Floating Audio Toggle - Bottom Right */}
      {videoAsset && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-[18%] right-[6%] p-3 rounded-full border border-white/20 bg-black/40 hover:bg-black/60 hover:scale-105 active:scale-95 transition-all text-white backdrop-blur-sm z-10"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </motion.button>
      )}
    </div>
  );
}
