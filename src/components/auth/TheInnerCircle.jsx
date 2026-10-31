import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Sparkles, Check, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import soundFx from '../../utils/soundFx';

export default function TheInnerCircle({ onUnlockSuccess }) {
  const { unlock, isVerifying, authError, setAuthError } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password.trim() || isVerifying || isSuccess) return;

    soundFx.playPop();
    const result = await unlock(password);

    if (result.success) {
      soundFx.playSuccess();
      setIsSuccess(true);
      setTimeout(() => {
        onUnlockSuccess?.();
      }, 1100);
    } else {
      soundFx.playPop();
      setShake(prev => prev + 1);
      // Select input for convenient re-entry
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col justify-between items-center relative overflow-hidden select-none px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Cinematic Ambient Atmosphere */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[900px] h-[450px] sm:h-[600px] rounded-full blur-[170px] pointer-events-none opacity-20 -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(20,184,166,0.15) 50%, transparent 80%)'
        }}
      />

      {/* Subtle Top Vignette Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025] -z-10"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* TOP: Brand Identity Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500">
            DOSTFLIX
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[10px] sm:text-xs font-mono font-medium tracking-[0.2em] text-zinc-400 uppercase">
            Vault
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] sm:text-xs font-mono text-zinc-400">
          <Lock size={11} className="text-zinc-400" />
          <span>Encrypted Session</span>
        </div>
      </header>

      {/* CENTER: The Inner Circle Authentication Form */}
      <main className="w-full max-w-md my-auto py-8 z-10 flex flex-col items-center text-center">
        
        {/* Subtle Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono tracking-[0.18em] text-zinc-400 uppercase mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span>The Inner Circle</span>
        </motion.div>

        {/* Editorial Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 leading-snug"
        >
          Some memories are meant to stay between us.
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
          className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mb-8"
        >
          A little corner of the internet, reserved for our favourite people and the moments we never want to forget.
        </motion.p>

        {/* Authentication Card / Form */}
        <motion.div
          key={shake}
          initial={{ x: 0 }}
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="w-full"
        >
          <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
            
            {/* Password Input Container */}
            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex items-center">
                <KeyRound size={17} />
              </div>

              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                disabled={isVerifying || isSuccess}
                autoFocus
                autoComplete="current-password"
                placeholder="Enter the secret passphrase"
                aria-label="Secret Passphrase"
                className={`w-full pl-10 pr-11 py-3.5 bg-zinc-900/60 border rounded-2xl text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-200 ${
                  authError 
                    ? 'border-rose-500/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30' 
                    : isSuccess
                      ? 'border-emerald-500/60 bg-emerald-500/[0.04]'
                      : 'border-white/[0.12] hover:border-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/20'
                }`}
              />

              {/* Password visibility toggle */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowPassword(prev => !prev);
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {authError && !isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-rose-400 font-medium py-1 px-1 text-center">
                    {authError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State Indicator */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Check size={14} strokeWidth={3} className="text-emerald-400" />
                  <span>Welcome to our little world.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            {!isSuccess && (
              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-zinc-200 active:scale-[0.99] text-zinc-950 font-bold text-sm transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying passphrase...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Dostflix</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}

          </form>
        </motion.div>

        {/* Sub-badge Requirement */}
        <div className="mt-8 text-[11px] font-mono tracking-wider text-zinc-500 uppercase flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-zinc-500" />
          <span>Private access · Friends only</span>
        </div>

      </main>

      {/* FOOTER: Minimal Privacy Assurance */}
      <footer className="w-full max-w-5xl text-center text-[10px] sm:text-xs text-zinc-600 font-mono z-10">
        <span>Curated with love for our inner circle • All rights reserved</span>
      </footer>

    </div>
  );
}
