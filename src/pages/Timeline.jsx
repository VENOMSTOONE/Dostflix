import React, { useState, useMemo } from 'react';
import { memories } from '../data/memories';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Play,
  ArrowRight,
  Sparkles,
  ArrowUpDown,
  Users,
  Video,
  Image as ImageIcon,
  Compass,
  Clock,
  ChevronRight,
  Eye,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CinemaPlayer from '../components/player/CinemaPlayer';
import { useTheme } from '../context/ThemeContext';
import soundFx from '../utils/soundFx';

const FRIEND_THEMES = {
  Vaibhav: { bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  Stuti: { bg: 'bg-rose-500', border: 'border-rose-500/30', text: 'text-rose-400' },
  Lakshay: { bg: 'bg-blue-500', border: 'border-blue-500/30', text: 'text-blue-400' }
};

const MOOD_STYLES = {
  funny: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  happy: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  peaceful: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
  emotional: 'bg-rose-500/15 border-rose-500/30 text-rose-400'
};

export default function Timeline() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = oldest first, 'desc' = newest first
  const [selectedFriend, setSelectedFriend] = useState('all');
  const [activePlayerMemory, setActivePlayerMemory] = useState(null);

  // Filter & sort memories
  const processedMemories = useMemo(() => {
    let list = [...memories];

    if (selectedFriend !== 'all') {
      list = list.filter(m => m.people?.includes(selectedFriend));
    }

    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [sortOrder, selectedFriend]);

  const toggleSort = () => {
    soundFx.playClick();
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const allMonths = useMemo(() => {
    const months = memories.map(m =>
      new Date(m.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    );
    return [...new Set(months)];
  }, []);

  return (
    <div className="bg-background min-h-screen text-white px-4 sm:px-8 md:px-12 py-10 md:py-16 select-none relative overflow-x-hidden">
      {/* Background Ambient Glows matching active theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[var(--accent)]/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-1/4 w-[600px] h-[300px] bg-[var(--accent)]/5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Embedded Cinema Player for instant story playback */}
      {activePlayerMemory && (
        <CinemaPlayer
          isOpen={Boolean(activePlayerMemory)}
          onClose={() => setActivePlayerMemory(null)}
          mediaAsset={
            activePlayerMemory.assets?.find(a => a.endsWith('.mp4')) ||
            activePlayerMemory.assets?.[0]
          }
          memoryId={activePlayerMemory.id}
        />
      )}

      {/* Header Section */}
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_var(--accent-glow)]">
          <Calendar size={14} />
          Moments in Time
        </div>

        {isFriendsTheme ? (
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white flex items-center justify-center flex-wrap">
            <span>T</span><span className="text-[#e50914] mx-1 md:mx-1.5">•</span>
            <span>I</span><span className="text-[#2563eb] mx-1 md:mx-1.5">•</span>
            <span>M</span><span className="text-[#eab308] mx-1 md:mx-1.5">•</span>
            <span>E</span><span className="text-[#e50914] mx-1 md:mx-1.5">•</span>
            <span>L</span><span className="text-[#eab308] mx-1 md:mx-1.5">•</span>
            <span>I</span><span className="text-[#2563eb] mx-1 md:mx-1.5">•</span>
            <span>N</span><span className="text-[#e50914] mx-1 md:mx-1.5">•</span>
            <span>E</span>
          </h1>
        ) : (
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
            The Timeline
          </h1>
        )}

        <p className="text-sm md:text-base text-zinc-400 font-light max-w-xl leading-relaxed">
          A chronological journey through our squad's favorite hangouts, late-night calls, road trips, and memories.
        </p>

        {/* Filter and Sorting Control Deck */}
        <div className="w-full mt-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          {/* Friend Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => {
                soundFx.playClick();
                setSelectedFriend('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFriend === 'all'
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              All Friends ({memories.length})
            </button>
            {['Vaibhav', 'Stuti', 'Lakshay'].map(name => (
              <button
                key={name}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedFriend(name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedFriend === name
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${FRIEND_THEMES[name].bg}`} />
                <span>{name}</span>
              </button>
            ))}
          </div>

          {/* Sort Order Action */}
          <button
            onClick={toggleSort}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/10 hover:border-white/20 transition-all ml-auto"
          >
            <ArrowUpDown size={14} className="text-[var(--accent)]" />
            <span>{sortOrder === 'asc' ? 'Oldest to Newest' : 'Newest to Oldest'}</span>
          </button>
        </div>
      </div>
      {/* Main Curved Timeline Journey */}
      <div className="max-w-5xl mx-auto relative pt-4 pb-20">

        {/* Global SVG Definitions for Neon Glowing Path */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="timelineCrimson" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
              <stop offset="50%" stopColor="var(--accent-hover)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.9" />
            </linearGradient>
            <filter id="crimsonNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {processedMemories.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            <p className="text-sm">No memories match this filter.</p>
            <button
              onClick={() => {
                soundFx.playSwoosh();
                setSelectedFriend('all');
              }}
              className="mt-3 px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-[0_0_12px_var(--accent-glow)]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {processedMemories.map((memory, index) => {
              const isEven = index % 2 === 0;
              const hasVideo = memory.assets?.some(a => a.endsWith('.mp4'));
              const milestoneIndex = String(index + 1).padStart(2, '0');

              return (
                <div
                  key={memory.id}
                  className="relative grid grid-cols-1 md:grid-cols-12 items-center min-h-[280px] md:min-h-[320px] py-4 md:py-6"
                >
                  {/* DESKTOP CURVED SVG RIBBON SEGMENT (Spans Center 2 cols) */}
                  <div className="hidden md:block absolute inset-0 col-span-12 pointer-events-none z-0">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      fill="none"
                    >
                      {/* Ambient Shadow Track */}
                      <path
                        d={
                          isEven
                            ? 'M 50 0 C 50 25, 20 25, 20 50 C 20 75, 50 75, 50 100'
                            : 'M 50 0 C 50 25, 80 25, 80 50 C 80 75, 50 75, 50 100'
                        }
                        stroke="#27272a"
                        strokeWidth="1.2"
                        strokeDasharray="2,2"
                        opacity="0.4"
                      />

                      {/* Glowing Curved S-Curve Trail */}
                      <path
                        d={
                          isEven
                            ? 'M 50 0 C 50 25, 20 25, 20 50 C 20 75, 50 75, 50 100'
                            : 'M 50 0 C 50 25, 80 25, 80 50 C 80 75, 50 75, 50 100'
                        }
                        stroke="url(#timelineCrimson)"
                        strokeWidth="1"
                        strokeLinecap="round"
                        filter="url(#crimsonNeonGlow)"
                      />

                      {/* Horizontal Connector Branch to Memory Card */}
                      <path
                        d={isEven ? 'M 20 50 L 5 50' : 'M 80 50 L 95 50'}
                        stroke="var(--accent)"
                        strokeWidth="0.8"
                        strokeDasharray="1,1"
                        opacity="0.7"
                      />
                    </svg>
                  </div>

                  {/* DESKTOP MILESTONE NODE (Anchored precisely at the curve crest) */}
                  <div
                    style={{ left: isEven ? '20%' : '80%', top: '50%' }}
                    className="hidden md:flex absolute -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center pointer-events-auto"
                  >
                    <div className="relative group cursor-default">
                      <div className="absolute -inset-2.5 rounded-full bg-[var(--accent)]/30 blur-sm group-hover:bg-[var(--accent)]/60 transition-all duration-300 animate-pulse" />
                      <div className="w-10 h-10 rounded-full bg-zinc-950 border-2 border-[var(--accent)] text-white font-black text-xs flex items-center justify-center shadow-[0_0_15px_var(--accent-glow)] group-hover:scale-110 transition-transform duration-300">
                        {milestoneIndex}
                      </div>
                    </div>
                  </div>

                  {/* MOBILE CURVED SERPENTINE TRACK (On Left Edge) */}
                  <div className="md:hidden absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-0">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 40 100"
                      preserveAspectRatio="none"
                      fill="none"
                    >
                      <path
                        d={
                          isEven
                            ? 'M 20 0 C 20 25, 8 25, 8 50 C 8 75, 20 75, 20 100'
                            : 'M 20 0 C 20 25, 32 25, 32 50 C 32 75, 20 75, 20 100'
                        }
                        stroke="url(#timelineCrimson)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        filter="url(#crimsonNeonGlow)"
                      />
                      <path
                        d={isEven ? 'M 8 50 L 38 50' : 'M 32 50 L 38 50'}
                        stroke="var(--accent)"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                      />
                    </svg>

                    {/* Mobile Node Badge */}
                    <div
                      style={{ left: isEven ? '8px' : '32px', top: '50%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-zinc-950 border border-[var(--accent)] text-white font-black text-[10px] flex items-center justify-center shadow-[0_0_10px_var(--accent-glow)]"
                    >
                      {milestoneIndex}
                    </div>
                  </div>

                  {/* LEFT COLUMN CONTENT (Card if isEven, Empty if odd on desktop) */}
                  <div
                    className={`col-span-12 md:col-span-5 pl-12 md:pl-0 z-10 ${
                      isEven ? 'md:order-1' : 'md:order-3 md:invisible'
                    }`}
                  >
                    {isEven && (
                      <TimelineCard
                        memory={memory}
                        milestoneIndex={milestoneIndex}
                        hasVideo={hasVideo}
                        onPlay={() => {
                          soundFx.playTudum();
                          setActivePlayerMemory(memory);
                        }}
                        onNavigate={() => {
                          soundFx.playPop();
                          navigate(`/memory/${memory.id}`);
                        }}
                      />
                    )}
                  </div>

                  {/* CENTER SPACER FOR DESKTOP (Spans 2 cols) */}
                  <div className="hidden md:block md:col-span-2 md:order-2" />

                  {/* RIGHT COLUMN CONTENT (Card if odd, Empty if even on desktop) */}
                  <div
                    className={`col-span-12 md:col-span-5 pl-12 md:pl-0 z-10 ${
                      !isEven ? 'md:order-3' : 'md:order-1 md:hidden'
                    }`}
                  >
                    {!isEven && (
                      <TimelineCard
                        memory={memory}
                        milestoneIndex={milestoneIndex}
                        hasVideo={hasVideo}
                        onPlay={() => {
                          soundFx.playTudum();
                          setActivePlayerMemory(memory);
                        }}
                        onNavigate={() => {
                          soundFx.playPop();
                          navigate(`/memory/${memory.id}`);
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// Sub-component: Rich Cinematic Timeline Card
function TimelineCard({ memory, milestoneIndex, hasVideo, onPlay, onNavigate }) {
  const formattedDate = new Date(memory.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onMouseEnter={() => soundFx.playHover()}
      className="bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-[var(--accent)]/40 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300 group flex flex-col"
    >
      {/* Media Banner Header */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
        <img
          src={memory.thumbnail}
          alt={memory.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.8] group-hover:brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white/90">
            <Calendar size={12} className="text-[var(--accent)]" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            {hasVideo ? (
              <>
                <Video size={11} className="text-[var(--accent)]" />
                <span>Video Story</span>
              </>
            ) : (
              <>
                <ImageIcon size={11} className="text-emerald-400" />
                <span>Photo Story</span>
              </>
            )}
          </div>
        </div>

        {/* Quick Play Trigger Icon on Media Hover */}
        {hasVideo && (
          <button
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] scale-90 group-hover:scale-100 transition-transform">
              <Play size={20} fill="currentColor" className="ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Card Content Details */}
      <div className="p-5 flex flex-col gap-3">
        {/* Mood and Location tags */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <MapPin size={13} className="text-[var(--accent)] flex-shrink-0" />
            <span className="font-medium text-zinc-300">{memory.location}</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider capitalize ${
              MOOD_STYLES[memory.mood] || 'bg-zinc-800 border-white/10 text-zinc-400'
            }`}
          >
            {memory.mood}
          </span>
        </div>

        {/* Story Title & Description */}
        <div>
          <h3 className="font-extrabold text-lg text-white group-hover:text-[var(--accent)] transition-colors">
            {memory.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1 line-clamp-2 leading-relaxed">
            {memory.description}
          </p>
        </div>

        {/* Tagged Friends Row */}
        {memory.people && memory.people.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
            <span className="text-[11px] text-zinc-500 font-medium mr-1">Squad:</span>
            <div className="flex flex-wrap gap-1.5">
              {memory.people.map(person => (
                <span
                  key={person}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-white/5 text-[11px] text-zinc-300 font-medium"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      FRIEND_THEMES[person]?.bg || 'bg-[var(--accent)]'
                    }`}
                  />
                  {person}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {hasVideo ? (
            <button
              onClick={onPlay}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Play size={12} fill="currentColor" />
              <span>Play Story</span>
            </button>
          ) : (
            <button
              onClick={onNavigate}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Eye size={12} />
              <span>View Story</span>
            </button>
          )}

          <button
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-white/5 hover:border-white/15 transition-all"
          >
            <span>Details</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
