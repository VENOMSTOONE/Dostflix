import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroLoader({ onFinish }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Play custom user-provided MP3 audio
    audioRef.current = new Audio('/loadingintro.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(e => {
      console.warn("Autoplay blocked or file missing:", e);
    });

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(onFinish, 800);
    }, 3800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          exit={{ opacity: 0, filter: 'blur(20px)', backdropFilter: 'blur(20px)' }}
          className="fixed inset-0 bg-background z-[9999] flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <motion.h1
              initial={{ letterSpacing: '0.1em', opacity: 0 }}
              animate={{ letterSpacing: '0.3em', opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="text-6xl font-black text-red-600 tracking-widest uppercase"
            >
              DostFlix
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}
              className="h-[2px] w-48 bg-gradient-to-r from-transparent via-red-600 to-transparent mt-4"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
