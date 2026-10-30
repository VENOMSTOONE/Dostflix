import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Sparkles, Music } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useMusic } from '../../context/AudioContext';
import soundFx from '../../utils/soundFx';

export default function ThemeSelectorModal({ isOpen, onClose }) {
  const { currentTheme, setTheme, themes } = useTheme();
  const { playTrack, switchTrack, isPlaying } = useMusic();
  const [showClapEffect, setShowClapEffect] = useState(false);

  const triggerClaps = (e) => {
    e?.stopPropagation();
    soundFx.playClap();
    setShowClapEffect(true);
    setTimeout(() => setShowClapEffect(false), 1200);
  };

  const handleSelectTheme = (selectedThemeId) => {
    setTheme(selectedThemeId);
    if (selectedThemeId === 'friends') {
      soundFx.playClap();
      setShowClapEffect(true);
      setTimeout(() => setShowClapEffect(false), 1200);
      playTrack('friends');
    } else {
      soundFx.playPop();
      switchTrack('default');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden z-10 flex flex-col gap-6"
        >
          {/* Subtle Ambient Radial Lighting in Modal matching current theme */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none -z-10 opacity-30"
            style={{ backgroundColor: currentTheme.colors.accent }}
          />

          {/* Modal Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
                style={{
                  backgroundColor: `${currentTheme.colors.accent}20`,
                  color: currentTheme.colors.accent
                }}
              >
                <Palette size={13} />
                <span>Atmosphere & Palette</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Choose Experience Theme
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1">
                Personalize colors, ambient lighting, and aesthetics across the entire platform.
              </p>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {themes.map(theme => {
              const isSelected = currentTheme.id === theme.id;

              return (
                <div
                  key={theme.id}
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                    isSelected
                      ? 'bg-zinc-900/90 shadow-xl'
                      : 'bg-zinc-900/40 hover:bg-zinc-900/70 border-white/5 hover:border-white/15'
                  }`}
                  style={{
                    borderColor: isSelected ? theme.colors.accent : undefined,
                    boxShadow: isSelected ? `0 0 20px ${theme.colors.accentGlow}` : undefined
                  }}
                >
                  {/* Top: Swatch & Badge */}
                  <div className="flex items-center justify-between">
                    {/* Color Swatch Trio */}
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 border border-white/10">
                      {theme.swatch.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-white/10 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                        {theme.badge}
                      </span>
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow"
                          style={{ backgroundColor: theme.colors.accent }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body: Title & Description */}
                  <div>
                    <h3
                      className={`text-base font-bold transition-colors ${
                        isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {theme.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-light mt-0.5 leading-relaxed">
                      {theme.desc}
                    </p>
                  </div>

                  {/* Special Sitcom Dot Preview for Friends theme */}
                  {theme.id === 'friends' && (
                    <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-black tracking-widest text-zinc-300">
                        <span>D</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>O</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>S</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span>T</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>F</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        <span>L</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>I</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>X</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-medium">
                        <Music size={11} className={isSelected && isPlaying ? "text-purple-400 animate-spin-slow" : "text-purple-400"} />
                        <span>
                          {isSelected && isPlaying ? "Now Playing: \"I'll Be There for You\"" : "Plays \"I'll Be There for You\" Theme Song"}
                        </span>
                      </div>

                      {/* Interactive 4 Claps Trigger */}
                      <button
                        type="button"
                        onClick={triggerClaps}
                        className="mt-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-[10px] text-purple-200 transition-all active:scale-95 group/clap shadow-sm"
                        title="Click to hear the iconic 4 claps!"
                      >
                        <span className="flex items-center gap-1.5 font-bold">
                          <span>👏 👏 👏 👏</span>
                          <span>The 4 Claps</span>
                        </span>
                        <span className="text-[9px] text-purple-300/80 group-hover/clap:text-white underline font-mono">Tap to clap</span>
                      </button>

                      {/* Claps pop animation */}
                      <AnimatePresence>
                        {showClapEffect && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.7, y: 5 }}
                            animate={{ opacity: 1, scale: 1.05, y: -8 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-purple-600 text-white font-black text-xs shadow-2xl flex items-center gap-1.5 border border-purple-300/40 pointer-events-none whitespace-nowrap"
                          >
                            <span>👏</span>
                            <span>👏</span>
                            <span>👏</span>
                            <span>👏</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider">CLAP!</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <span>Themes apply instantly across all pages and save automatically.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95"
              style={{ backgroundColor: currentTheme.colors.accent }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
