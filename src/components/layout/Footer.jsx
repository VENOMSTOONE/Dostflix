import React from 'react';
import { Tv, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';

export default function Footer({ onOpenLounge }) {
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

  return (
    <footer className="w-full bg-surface/40 border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex flex-col items-center sm:items-start gap-1">
          {isFriendsTheme ? (
            <span className="font-mono font-bold tracking-widest text-zinc-300">
              D<span className="text-[#e50914]">•</span>O<span className="text-[#2563eb]">•</span>S<span className="text-[#eab308]">•</span>T<span className="text-[#e50914]">•</span>F<span className="text-[#2563eb]">•</span>L<span className="text-[#eab308]">•</span>I<span className="text-[#e50914]">•</span>X
            </span>
          ) : (
            <span className="font-bold text-zinc-300">DostFlix Memory Streaming</span>
          )}
          <p className="font-light text-zinc-500">&copy; {new Date().getFullYear()} Vaibhav, Stuti & Lakshay. All memories preserved.</p>
        </div>

        {onOpenLounge && (
          <button
            onClick={() => {
              soundFx.playPop();
              onOpenLounge();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-all active:scale-95 text-xs"
          >
            <Tv size={14} className="text-[var(--accent)]" />
            <span>Launch Lounge Screensaver</span>
          </button>
        )}
      </div>
    </footer>
  );
}

