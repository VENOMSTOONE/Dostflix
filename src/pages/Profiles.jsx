import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import IntroLoader from '../components/ui/IntroLoader';

const profilesItems = [
  { id: '1', name: 'Vaibhav', color: 'bg-emerald-500' },
  { id: '2', name: 'Stuti', color: 'bg-rose-500' },
  { id: '3', name: 'Lakshay', color: 'bg-blue-500' },
];

export default function Profiles() {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (profile) => {
    setSelectedProfile(profile);
    localStorage.setItem('activeProfile', JSON.stringify(profile));
    setIsLoading(true);
  };

  const handleFinishLoading = () => {
    navigate('/home');
  };

  if (isLoading) {
    return <IntroLoader onFinish={handleFinishLoading} />;
  }

  return (
    <div className="bg-background min-h-screen text-white flex flex-col items-center justify-center select-none fixed inset-0 z-[100]">
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 md:left-12 opacity-90">
        <h1 className="text-3xl font-black tracking-tight text-red-600">DostFlix</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-10 w-full"
      >
        <h1 className="text-3xl md:text-5xl font-normal tracking-wide">Who's watching?</h1>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {profilesItems.map((profile) => (
            <motion.div
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(profile)}
              className="flex flex-col items-center gap-4 cursor-pointer group"
            >
              <div
                className={`w-28 h-28 md:w-36 md:h-36 rounded-md ${profile.color} flex items-center justify-center border-2 border-transparent group-hover:border-white transition-colors shadow-lg overflow-hidden relative`}
              >
                {/* Fallback pattern to give it texture */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <span className="text-5xl font-black text-white/50">{profile.name[0]}</span>
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
