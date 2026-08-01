import React from 'react';
import { Play, Pause, Music, Volume2 } from 'lucide-react';
import { useMusic } from '../../context/AudioContext';
import { motion } from 'framer-motion';

export default function MusicPlayer() {
  const { isPlaying, toggleMusic } = useMusic();

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      onClick={toggleMusic}
      className="fixed bottom-6 left-6 z-[100] flex items-center gap-3 bg-surface/80 backdrop-blur-md border border-white/10 p-3 rounded-full shadow-2xl hover:border-accent group"
    >
      <div className={`p-2 rounded-full ${isPlaying ? 'bg-accent text-black animate-spin-slow' : 'bg-white/10 text-white'}`}>
        <Music size={16} />
      </div>
      <span className="text-xs font-bold text-primary/80 group-hover:text-white mr-2">
        {isPlaying ? 'Ambient Mood' : 'Play Soundtrack'}
      </span>
      {isPlaying ? <Pause size={14} className="text-accent" /> : <Play size={14} />}
    </motion.button>
  );
}
