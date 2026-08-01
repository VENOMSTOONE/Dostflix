import React, { useState } from 'react';
import { memories } from '../data/memories';
import { MapPin, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Mock location pins mapped to generic screen points
const locPins = [
  { name: 'Udaipur', x: '25%', y: '40%', description: 'Historic lakes & postcards' },
  { name: 'Dosa Cafe', x: '45%', y: '60%', description: 'Dosas & long dinners' },
  { name: 'Ice Cream Parlor', x: '60%', y: '30%', description: 'Natural ice cream scoops' },
  { name: 'Retro Arcade', x: '75%', y: '65%', description: 'Black & white photo booths' },
  { name: 'Home Office', x: '35%', y: '75%', description: 'Time-lapses and video calls' },
];

export default function MapView() {
  const navigate = useNavigate();
  const [selectedLoc, setSelectedLoc] = useState(null);

  const getMemoriesForLocation = (locName) => {
    return memories.filter(m => m.location.toLowerCase() === locName.toLowerCase());
  };

  return (
    <div className="bg-background min-h-screen text-white px-6 md:px-12 py-12 md:py-20 select-none overflow-hidden relative">
      <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-center">Wanderlust Chronicles</h1>
      <p className="text-sm text-primary/50 text-center mb-12 font-light">Interactive tracking of cities and spaces where we created memories.</p>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Interactive Map Board */}
        <div className="lg:col-span-3 aspect-[16/9] w-full bg-surface/30 rounded-3xl border border-white/5 relative overflow-hidden backdrop-blur-sm shadow-2xl">
          {/* Dynamic Grid Background mapping */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px]" />

          {/* Vector Map shape / outline abstract graphics */}
          <svg className="absolute inset-0 w-full h-full text-white/5 opacity-25" viewBox="0 0 800 450" fill="none">
            <path d="M150 100 C 200 80, 300 150, 350 120 C 400 90, 500 130, 600 110 C 700 90, 750 200, 700 300 C 650 400, 550 350, 450 380 C 350 410, 250 380, 200 350 C 150 320, 100 200, 150 100 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
            <circle cx="400" cy="225" r="180" stroke="currentColor" strokeWidth="1" />
          </svg>

          {/* Render pins */}
          {locPins.map(pin => (
            <motion.div
              key={pin.name}
              style={{ left: pin.x, top: pin.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              whileHover={{ scale: 1.2 }}
              onClick={() => setSelectedLoc(pin)}
            >
              <div className="relative flex items-center justify-center">
                <MapPin className="text-red-500 hover:text-accent transition-colors shadow-lg filter drop-shadow-[0_0_10px_#e50914]" size={32} />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-2.5 py-0.5 rounded text-[10px] whitespace-nowrap font-bold tracking-wide border border-white/10 uppercase">
                  {pin.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Details Sidebar / Tray */}
        <div className="bg-surface/50 border border-white/5 p-6 rounded-3xl flex flex-col gap-6 h-full justify-between shadow-2xl relative">
          <AnimatePresence mode="wait">
            {selectedLoc ? (
              <motion.div
                key={selectedLoc.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-2xl text-accent">{selectedLoc.name}</h3>
                    <p className="text-xs text-primary/50 font-light mt-0.5">{selectedLoc.description}</p>
                  </div>
                  <button onClick={() => setSelectedLoc(null)} className="p-1.5 hover:bg-white/10 rounded-full text-primary/75">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs uppercase font-bold text-primary/45 tracking-wider">Memories Here</h4>
                  <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                    {getMemoriesForLocation(selectedLoc.name).map(m => (
                      <div
                        key={m.id}
                        onClick={() => navigate(`/memory/${m.id}`)}
                        className="flex gap-3 bg-surface p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-accent transition-all group"
                      >
                        <img src={m.thumbnail} className="w-16 aspect-video rounded object-cover shadow" alt="" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-white group-hover:text-accent transition-colors truncate">{m.title}</h5>
                          <span className="text-[10px] text-primary/55 font-light">{new Date(m.date).getFullYear()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-primary/30">
                <MapPin size={48} className="mb-4 animate-bounce" />
                <p className="font-semibold text-sm">Select a Pin</p>
                <p className="text-xs max-w-[200px] mt-1 pl-2">Click any map coordinates to reveal memories associated with locales.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
