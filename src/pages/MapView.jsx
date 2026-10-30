import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { memories } from '../data/memories';
import {
  MapPin,
  Compass,
  Navigation,
  Utensils,
  Gamepad2,
  Laptop,
  Calendar,
  Users,
  Play,
  ArrowRight,
  X,
  ChevronRight,
  Sparkles,
  Shuffle,
  Layers,
  Map as MapIcon,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import soundFx from '../utils/soundFx';

const LOCATIONS = [
  {
    id: 'loc-udaipur',
    name: 'Udaipur',
    shortName: 'Udaipur',
    category: 'travel',
    tag: 'Wanderlust & Heritage',
    coords: '24.5854° N, 73.7125° E',
    x: '20%',
    y: '36%',
    icon: Compass,
    color: 'emerald',
    description: 'Heritage courtyards, Jagat Niwas, serene lake palace views, and handwritten postcards sent across borders.',
    vibes: 'Historic wanderlust & royal serenity'
  },
  {
    id: 'loc-office',
    name: 'Home Office',
    shortName: 'Home Office',
    category: 'code',
    tag: 'Virtual Hub & Code',
    coords: '28.7041° N, 77.1025° E',
    x: '34%',
    y: '80%',
    icon: Laptop,
    color: 'sky',
    description: 'Dual-monitor setups, camera time-lapses, late-night Discord calls, and debugging stubborn bugs side by side.',
    vibes: 'Study sesh, screen shares & inside jokes'
  },
  {
    id: 'loc-dosa',
    name: 'Dosa Cafe',
    shortName: 'Dosa Cafe',
    category: 'food',
    tag: 'Food & Banter',
    coords: '28.4595° N, 77.0266° E',
    x: '46%',
    y: '54%',
    icon: Utensils,
    color: 'amber',
    description: 'Hot crispy ghee dosas, endless chutney refills, bill splitting, and loud laughter in packed restaurant corners.',
    vibes: 'Hearty eats & squad food runs'
  },
  {
    id: 'loc-ice-cream',
    name: 'Ice Cream Parlor',
    shortName: 'Naturals Parlor',
    category: 'food',
    tag: 'Late-Night Dessert',
    coords: '28.5355° N, 77.3910° E',
    x: '66%',
    y: '26%',
    icon: Utensils,
    color: 'rose',
    description: 'Late-night scoop runs at Naturals, debating tender coconut vs mango, and strolling the streets after midnight.',
    vibes: 'Sweet treats & midnight munchies'
  },
  {
    id: 'loc-arcade',
    name: 'Retro Arcade',
    shortName: 'Retro Arcade',
    category: 'fun',
    tag: 'Arcade & Photobooth',
    coords: '28.6139° N, 77.2090° E',
    x: '80%',
    y: '64%',
    icon: Gamepad2,
    color: 'red',
    description: 'Black and white vintage photo booths, silly poses, air hockey rivalries, and laughing until our ribs hurt.',
    vibes: 'Nostalgic games & chaotic giggles'
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Squad Hubs' },
  { id: 'food', label: 'Food & Cafes' },
  { id: 'travel', label: 'Wanderlust' },
  { id: 'fun', label: 'Entertainment' },
  { id: 'code', label: 'Code & Study' },
];

const FRIEND_COLORS = {
  Vaibhav: 'bg-emerald-500',
  Stuti: 'bg-rose-500',
  Lakshay: 'bg-blue-500'
};

export default function MapView() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[1]); // Default to Dosa Cafe
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFlightPaths, setShowFlightPaths] = useState(true);

  const getMemoriesForLocation = (locName) => {
    return memories.filter(m => m.location.toLowerCase() === locName.toLowerCase());
  };

  const filteredLocations = useMemo(() => {
    if (activeCategory === 'all') return LOCATIONS;
    return LOCATIONS.filter(l => l.category === activeCategory);
  }, [activeCategory]);

  const handleShuffle = () => {
    const remaining = LOCATIONS.filter(l => l.id !== selectedLoc?.id);
    const randomPick = remaining[Math.floor(Math.random() * remaining.length)];
    setSelectedLoc(randomPick);
  };

  const activeMemories = selectedLoc ? getMemoriesForLocation(selectedLoc.name) : [];

  // Extract all distinct tagged people for the selected location
  const taggedFriends = useMemo(() => {
    if (!activeMemories.length) return [];
    const names = activeMemories.flatMap(m => m.people || []);
    return [...new Set(names)];
  }, [activeMemories]);

  return (
    <div className="bg-background min-h-screen text-white px-4 sm:px-8 md:px-12 py-10 md:py-14 select-none relative overflow-x-hidden">
      {/* Cinematic Ambient Glows matching active theme */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-[var(--accent)]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[350px] bg-[var(--accent)]/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_var(--accent-glow)]">
            <MapPin size={14} />
            Places & Hangouts
          </div>
          {isFriendsTheme ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-center flex-wrap">
              <span>P</span><span className="text-[#e50914] mx-1">•</span>
              <span>L</span><span className="text-[#2563eb] mx-1">•</span>
              <span>A</span><span className="text-[#eab308] mx-1">•</span>
              <span>C</span><span className="text-[#e50914] mx-1">•</span>
              <span>E</span><span className="text-[#2563eb] mx-1">•</span>
              <span>S</span>
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Where We Made Memories
            </h1>
          )}
          <p className="text-sm md:text-base text-zinc-400 font-light mt-1 max-w-2xl">
            Explore the spots across Delhi NCR and Rajasthan where our squad gathered for food, road trips, and late-night sessions.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowFlightPaths(!showFlightPaths);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showFlightPaths
                ? 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)] shadow-[0_0_15px_var(--accent-glow)]'
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Navigation size={14} />
            <span>{showFlightPaths ? 'Travel Route: Visible' : 'Travel Route: Hidden'}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playShuffle();
              handleShuffle();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-white/10 hover:border-white/20 transition-all shadow-md active:scale-95"
          >
            <Shuffle size={14} className="text-[var(--accent)]" />
            <span>Random Spot</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              soundFx.playPop();
              setActiveCategory(cat.id);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Map Canvas (Col 8) + Locale Drawer (Col 4) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* Modern Map Canvas */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#0d0d12] rounded-3xl border border-white/10 relative overflow-hidden backdrop-blur-md shadow-2xl min-h-[440px] sm:min-h-[500px] md:min-h-[560px] flex flex-col justify-between p-4 sm:p-6">

          {/* Clean Map Header Status */}
          <div className="flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="text-xs font-medium tracking-wide text-zinc-300">
                {LOCATIONS.length} Squad Locations · Delhi NCR & Udaipur
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500 font-medium">
              <span>Interactive Map</span>
            </div>
          </div>

          {/* Modern Cartographic Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Subtle grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />

            {/* Stylized Modern Geographic Curves */}
            <svg className="absolute inset-0 w-full h-full text-white/5 opacity-50" viewBox="0 0 900 600" fill="none">
              {/* Soft topographic geographic terrain ribbons */}
              <path d="M 0 150 Q 250 100, 480 200 T 900 120" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 0 350 Q 200 420, 500 320 T 900 400" stroke="currentColor" strokeWidth="1.5" />
              <path d="M 120 0 Q 280 250, 180 600" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />
              <path d="M 680 0 Q 600 300, 750 600" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" />

              {/* Animated Travel Route Ribbon matching theme */}
              {showFlightPaths && (
                <g>
                  <path
                    d="M 180 216 Q 240 380, 306 480 Q 360 410, 414 324 Q 500 180, 594 156 Q 660 250, 720 384"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    className="opacity-80"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Interactive Location Nodes */}
          <div className="absolute inset-0">
            {filteredLocations.map(loc => {
              const isSelected = selectedLoc?.id === loc.id;
              const IconComponent = loc.icon;
              const count = getMemoriesForLocation(loc.name).length;

              return (
                <div
                  key={loc.id}
                  style={{ left: loc.x, top: loc.y }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'z-30' : 'z-10 hover:z-20'
                  }`}
                  onClick={() => {
                    soundFx.playPin();
                    setSelectedLoc(loc);
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="relative flex flex-col items-center group pointer-events-auto"
                  >
                    {/* Pulsing Radar Aura */}
                    <div
                      className={`absolute -inset-4 rounded-full transition-opacity duration-300 pointer-events-none ${
                        isSelected
                          ? 'bg-[var(--accent)]/25 animate-ping opacity-100'
                          : 'bg-[var(--accent)]/10 group-hover:opacity-100 opacity-0'
                      }`}
                    />

                    {/* Central Pin Icon Shield */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors duration-200 shadow-xl relative border ${
                        isSelected
                          ? 'bg-[var(--accent)] border-white text-white shadow-[0_0_25px_var(--accent-glow)]'
                          : 'bg-zinc-900/90 border-white/15 text-zinc-300 group-hover:border-[var(--accent)] group-hover:text-white group-hover:bg-zinc-800'
                      }`}
                    >
                      <IconComponent size={20} />
                      {count > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-zinc-950 font-black text-[10px] flex items-center justify-center shadow">
                          {count}
                        </span>
                      )}
                    </div>

                    {/* Location Name & Tag Pill */}
                    <div
                      className={`mt-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 border shadow-lg ${
                        isSelected
                          ? 'bg-white text-zinc-950 border-white font-extrabold shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
                          : 'bg-zinc-950/90 text-zinc-300 border-white/10 group-hover:border-white/30'
                      }`}
                    >
                      <span>{loc.name}</span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Bottom HUD Quick Selector Strip */}
          <div className="z-20 pt-4 border-t border-white/5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2">
              {LOCATIONS.map(loc => {
                const isSelected = selectedLoc?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      soundFx.playPin();
                      setSelectedLoc(loc);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[var(--accent)]' : 'bg-zinc-600'}`} />
                    {loc.shortName}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-zinc-500 hidden sm:inline whitespace-nowrap">
              Click any pin or chip to inspect
            </span>
          </div>

        </div>

        {/* Locale Details Drawer / Sidebar (Col 4) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {selectedLoc ? (
              <motion.div
                key={selectedLoc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col gap-6"
              >
                {/* Locale Hero Card Top */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] w-full border border-white/10 shadow-lg group">
                  {activeMemories[0] && (
                    <img
                      src={activeMemories[0].thumbnail}
                      alt={selectedLoc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.75]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  {/* Badges on hero */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {selectedLoc.tag}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white">{selectedLoc.name}</h3>
                      <p className="text-[11px] font-mono text-zinc-300">{selectedLoc.coords}</p>
                    </div>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedLoc(null);
                      }}
                      className="p-1.5 rounded-full bg-black/50 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors"
                      title="Close drawer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Vibe and Description */}
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-1">About This Spot</div>
                  <p className="text-sm text-zinc-300 leading-relaxed font-light">
                    {selectedLoc.description}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800/60 border border-white/5 text-xs text-zinc-300">
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Vibe: {selectedLoc.vibes}</span>
                  </div>
                </div>

                {/* Tagged Squad Members */}
                {taggedFriends.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2 flex items-center gap-1.5">
                      <Users size={12} />
                      <span>Squad Present Here</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {taggedFriends.map(friend => (
                        <div
                          key={friend}
                          className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-white"
                        >
                          <span className={`w-2 h-2 rounded-full ${FRIEND_COLORS[friend] || 'bg-[var(--accent)]'}`} />
                          <span>{friend}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Memories Section */}
                <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">
                      Stories Recorded ({activeMemories.length})
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {activeMemories.map(mem => (
                      <div
                        key={mem.id}
                        onMouseEnter={() => soundFx.playHover()}
                        className="bg-zinc-950/70 p-3 rounded-2xl border border-white/5 hover:border-[var(--accent)]/40 transition-all flex flex-col gap-3 group"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="relative w-20 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={mem.thumbnail}
                              alt={mem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-1 left-1 bg-black/60 p-1 rounded-md text-white/80">
                              {mem.mediaType === 'image' ? <ImageIcon size={10} /> : <Video size={10} />}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors truncate">
                              {mem.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                              <Calendar size={11} className="text-[var(--accent)]" />
                              <span>{new Date(mem.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="capitalize text-zinc-400">{mem.mood}</span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              soundFx.playTudum();
                              navigate(`/memory/${mem.id}?play=true`);
                            }}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all shadow-md active:scale-95"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Play Story</span>
                          </button>
                          <button
                            onClick={() => {
                              soundFx.playPop();
                              navigate(`/memory/${mem.id}`);
                            }}
                            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/5 transition-all"
                          >
                            <span>Details</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              /* Empty state overview when nothing is selected */
              <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-4 animate-pulse">
                  <MapIcon size={30} />
                </div>
                <h3 className="text-lg font-bold text-white">Select a Squad Hub</h3>
                <p className="text-xs text-zinc-400 max-w-[240px] mt-1.5 font-light leading-relaxed">
                  Click any marker or flight path node on the radar to inspect stories, photos, and tagged friends.
                </p>
                <div className="flex flex-col gap-2 w-full mt-6">
                  {LOCATIONS.slice(0, 3).map(l => (
                    <button
                      key={l.id}
                      onClick={() => {
                        soundFx.playPin();
                        setSelectedLoc(l);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 border border-white/5 text-xs text-left text-zinc-300 hover:text-white transition-all"
                    >
                      <span className="font-semibold">{l.name}</span>
                      <ChevronRight size={14} className="text-zinc-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
