import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function IntroLoader({ onFinish }) {
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';
  const [isAnimating, setIsAnimating] = useState(true);
  const audioRef = useRef(null);
  const onFinishRef = useRef(onFinish);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const handleFinish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsAnimating(false);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
      } catch (e) {}
    }
    // Transition to the next screen immediately
    onFinishRef.current?.();
  };

  useEffect(() => {
    // Play custom user-provided MP3 audio safely
    try {
      const audio = new Audio('/loadingintro.mp3');
      audio.volume = 0.5;
      audioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn("Autoplay blocked or file missing:", e);
        });
      }
    } catch (e) {
      console.warn("Audio initialization error:", e);
    }

    // Auto-advance after 2.6 seconds of cinematic animation
    const timer = setTimeout(() => {
      handleFinish();
    }, 2600);

    const handleKey = (e) => {
      handleFinish();
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.src = '';
        } catch (e) {}
      }
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={() => onFinishRef.current?.()}>
      {isAnimating && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(16px)', scale: 1.05 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          onClick={handleFinish}
          className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center cursor-pointer select-none"
          title="Click to skip intro"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <motion.h1
              initial={{ letterSpacing: '0.1em', opacity: 0 }}
              animate={{ letterSpacing: '0.28em', opacity: 1 }}
              transition={{ duration: 1.1 }}
              className="text-5xl md:text-6xl font-black tracking-widest uppercase"
            >
              {isFriendsTheme ? (
                <span className="font-mono text-white drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  D<span className="text-[#e50914]">•</span>O<span className="text-[#2563eb]">•</span>S<span className="text-[#eab308]">•</span>T<span className="text-[#e50914]">•</span>F<span className="text-[#2563eb]">•</span>L<span className="text-[#eab308]">•</span>I<span className="text-[#e50914]">•</span>X
                </span>
              ) : (
                <span className="text-[var(--accent)] drop-shadow-[0_0_25px_var(--accent-glow)]">DostFlix</span>
              )}
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
              className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mt-4"
            />
          </motion.div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-10 text-[11px] font-medium tracking-widest uppercase text-zinc-400"
          >
            Tap anywhere to skip
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
