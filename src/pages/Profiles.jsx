import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import soundFx from '../utils/soundFx';

const profilesItems = [
  { id: '1', name: 'Vaibhav', color: 'bg-emerald-500' },
  { id: '2', name: 'Stuti', color: 'bg-rose-500' },
  { id: '3', name: 'Lakshay', color: 'bg-blue-500' },
];

export default function Profiles() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';
  const [selectedProfile, setSelectedProfile] = useState(null);

  const handleSelect = (profile) => {
    soundFx.playPop();
    setSelectedProfile(profile);
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    setTimeout(() => {
      navigate('/home');
    }, 150);
  };

  return (
    <div className="bg-background min-h-screen text-white flex flex-col items-center justify-center select-none fixed inset-0 z-[100]">
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 md:left-12 opacity-90">
        {isFriendsTheme ? (
          <h1 className="text-3xl font-black tracking-widest font-mono text-white">
            D<span className="text-[#e50914]">•</span>O<span className="text-[#2563eb]">•</span>S<span className="text-[#eab308]">•</span>T<span className="text-[#e50914]">•</span>F<span className="text-[#2563eb]">•</span>L<span className="text-[#eab308]">•</span>I<span className="text-[#e50914]">•</span>X
          </h1>
        ) : (
          <h1 className="text-3xl font-black tracking-tight text-[var(--accent)]">DostFlix</h1>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-10 w-full"
      >
        <h1 className="text-3xl md:text-5xl font-normal tracking-wide">Who's watching?</h1>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {profilesItems.map((profile) => (
            <motion.div
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(profile)}
              className="flex flex-col items-center gap-4 cursor-pointer group relative"
            >
              <div
                className={`w-28 h-28 md:w-36 md:h-36 rounded-md ${profile.color} flex items-center justify-center border-2 border-transparent group-hover:border-white transition-colors shadow-lg overflow-hidden relative`}
              >
                {/* Fallback pattern to give it texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <span className="text-5xl font-black text-white/50">{profile.name[0]}</span>

                {/* Monica's Yellow Door Peephole Frame in Friends Theme */}
                {isFriendsTheme && (
                  <div className="absolute inset-0 border-[4px] border-[#eab308] pointer-events-none shadow-[0_0_20px_rgba(234,179,8,0.5)] z-20 flex flex-col justify-between p-1">
                    {/* Golden Victorian corner accents */}
                    <div className="flex justify-between items-start">
                      <span className="w-2 h-2 rounded-full bg-[#fde047] shadow-sm border border-[#ca8a04]" />
                      <span className="w-2 h-2 rounded-full bg-[#fde047] shadow-sm border border-[#ca8a04]" />
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="w-2 h-2 rounded-full bg-[#fde047] shadow-sm border border-[#ca8a04]" />
                      <span className="w-2 h-2 rounded-full bg-[#fde047] shadow-sm border border-[#ca8a04]" />
                    </div>
                  </div>
                )}
              </div>
              <span className="text-primary/70 font-medium group-hover:text-white transition-colors">
                {profile.name}
              </span>
            </motion.div>
          ))}
        </div>

        <button className="mt-8 px-6 py-2 border border-primary/30 text-primary/60 font-medium tracking-widest hover:border-white hover:text-white transition-colors uppercase text-sm">
          Manage Profiles
        </button>
      </motion.div>
    </div>
  );
}
