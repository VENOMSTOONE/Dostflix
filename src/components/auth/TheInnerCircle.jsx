import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import soundFx from '../../utils/soundFx';

export default function TheInnerCircle({ onUnlockSuccess }) {
  const { unlock, isVerifying, authError, setAuthError } = useAuth();
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

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
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Cinematic Poster Backdrop with Netflix Vignette */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Memory Poster Grid Texture */}
        <div 
          className="absolute inset-0 opacity-15 scale-105 filter blur-[3px]"
          style={{
            backgroundImage: `radial-gradient(circle at center, transparent 0%, #09090b 80%), 
              repeating-linear-gradient(45deg, #18181b 0, #18181b 120px, #121215 120px, #121215 240px)`,
            backgroundSize: 'cover'
          }}
        />

        {/* Ambient Radial Theme Spotlight */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[1000px] h-[500px] md:h-[700px] rounded-full blur-[190px] opacity-25 transition-colors duration-700"
          style={{ backgroundColor: currentTheme.colors.accent }}
        />

        {/* Deep Netflix Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-[#09090b]/60" />
      </div>

      {/* TOP HEADER: Official DostFlix Brand Identity */}
      <header className="w-full px-6 sm:px-12 md:px-16 py-6 sm:py-8 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2 select-none">
          {isFriendsTheme ? (
            <div className="flex items-center text-2xl sm:text-3xl font-black tracking-widest text-white">
              <span>D</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-0.5 sm:mx-1" />
              <span>O</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-0.5 sm:mx-1" />
              <span>S</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mx-0.5 sm:mx-1" />
              <span>T</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-0.5 sm:mx-1" />
              <span>F</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mx-0.5 sm:mx-1" />
              <span>L</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-0.5 sm:mx-1" />
              <span>I</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-0.5 sm:mx-1" />
              <span>X</span>
            </div>
          ) : (
            <h1
              className="text-3xl sm:text-4xl font-black tracking-tighter"
              style={{ 
                color: currentTheme.colors.accent,
                textShadow: '0 0 25px var(--accent-glow)'
              }}
            >
              DostFlix
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-lg">
          <Lock size={12} style={{ color: currentTheme.colors.accent }} />
          <span className="tracking-wide">Private Vault</span>
        </div>
      </header>

      {/* CENTER: Netflix-Style Authentication Card */}
      <main className="w-full flex-1 flex items-center justify-center px-4 sm:px-6 py-6 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[460px] bg-black/75 sm:bg-black/80 border border-white/10 rounded-2xl sm:rounded-3xl p-7 sm:p-11 shadow-2xl backdrop-blur-2xl flex flex-col relative"
        >
          {/* Subtle Accent Glow Ring at Top of Card */}
          <div 
            className="absolute top-0 inset-x-8 h-[2px] rounded-full blur-[1px] opacity-75"
            style={{ 
              background: `linear-gradient(90deg, transparent, ${currentTheme.colors.accent}, transparent)` 
            }}
          />

          {/* Section Eyebrow */}
          <div className="flex items-center gap-2 mb-4">
            <span 
              className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_var(--accent-glow)]"
              style={{ backgroundColor: currentTheme.colors.accent }}
            />
            <span 
              className="text-[11px] font-bold tracking-[0.2em] uppercase font-mono"
              style={{ color: currentTheme.colors.accent }}
            >
              The Inner Circle
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2 leading-tight">
            Some memories are meant to stay between us.
          </h2>

          {/* Supporting Copy */}
          <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed mb-6">
            A little corner of the internet, reserved for our favourite people and the moments we never want to forget.
          </p>

          {/* Form */}
          <motion.div
            key={shake}
            initial={{ x: 0 }}
            animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="w-full"
          >
            <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
              
              {/* Password Input */}
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
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
                  className={`w-full pl-11 pr-11 py-3.5 bg-zinc-800/80 hover:bg-zinc-800 focus:bg-zinc-800/95 border rounded-xl text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-200 ${
                    authError 
                      ? 'border-red-500/80 focus:border-red-400 focus:ring-1 focus:ring-red-500/30' 
                      : isSuccess
                        ? 'border-emerald-500/80 bg-emerald-500/10'
                        : 'border-white/10 hover:border-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/20'
                  }`}
                />

                {/* Password Visibility Toggle */}
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
                    <div className="px-3.5 py-2 rounded-xl bg-red-600/15 border border-red-500/30 text-red-300 text-xs font-medium text-left">
                      {authError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success State Indicator */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Check size={16} strokeWidth={3} className="text-emerald-400" />
                    <span>Welcome to our little world.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Signature Netflix Theme Button */}
              {!isSuccess && (
                <button
                  type="submit"
                  disabled={isVerifying || !password.trim()}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-white tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:brightness-110 active:scale-[0.99]"
                  style={{
                    backgroundColor: currentTheme.colors.accent,
                    boxShadow: `0 4px 20px ${currentTheme.colors.accentGlow || 'rgba(229, 9, 20, 0.4)'}`
                  }}
                >
                  {isVerifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying passphrase...</span>
                    </>
                  ) : (
                    <>
                      <span>Unlock Dostflix</span>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              )}

            </form>
          </motion.div>

          {/* Sub-badge Requirement */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-1.5 text-xs text-zinc-500 font-medium">
            <ShieldCheck size={14} className="text-zinc-500" />
            <span>Private access · Friends only</span>
          </div>

        </motion.div>
      </main>

      {/* FOOTER: Authentic Dostflix Footer */}
      <footer className="w-full py-5 text-center text-xs text-zinc-500 z-10 relative border-t border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <span>Dostflix Private Vault · Reserved for our favourite people</span>
      </footer>

    </div>
  );
}
