import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal, Eye, Calendar, MapPin, Tag, Users, Film, Video, Image as ImageIcon } from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import soundFx from '../utils/soundFx';

const SUGGESTED_TAGS = ['Naturals', 'Dosa', 'Photobooth', 'Udaipur', 'Coding', 'Banter', 'Ice Cream', 'Late Nights'];

const FRIEND_THEMES = {
  Vaibhav: 'bg-emerald-500',
  Stuti: 'bg-rose-500',
  Lakshay: 'bg-blue-500'
};

export default function Search() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { memories, collections } = useMemories();
  const isFriendsTheme = currentTheme?.id === 'friends';

  const [query, setQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState('all');

  // Extract distinct moods and people
  const allMoods = useMemo(() => {
    return [...new Set(memories.map(m => m.mood))];
  }, []);

  const allPeople = ['Vaibhav', 'Stuti', 'Lakshay'];

  const filteredMemories = useMemo(() => {
    return memories.filter(memory => {
      const matchQuery =
        !query ||
        memory.title.toLowerCase().includes(query.toLowerCase()) ||
        memory.description.toLowerCase().includes(query.toLowerCase()) ||
        memory.location.toLowerCase().includes(query.toLowerCase()) ||
        memory.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

      const matchMood = selectedMood === 'all' || memory.mood === selectedMood;
      const matchCollection = selectedCollection === 'all' || memory.collectionId === selectedCollection;
      const matchPerson = selectedPerson === 'all' || memory.people?.includes(selectedPerson);

      return matchQuery && matchMood && matchCollection && matchPerson;
    });
  }, [query, selectedMood, selectedCollection, selectedPerson]);

  const clearFilters = () => {
    soundFx.playSwoosh();
    setQuery('');
    setSelectedMood('all');
    setSelectedCollection('all');
    setSelectedPerson('all');
  };

  const hasActiveFilters = query || selectedMood !== 'all' || selectedCollection !== 'all' || selectedPerson !== 'all';

  return (
    <div className="bg-background min-h-screen text-white px-4 sm:px-8 md:px-12 py-10 md:py-16 select-none relative overflow-x-hidden">
      {/* Ambient Lighting matching active theme */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[350px] bg-[var(--accent)]/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Search Header Container */}
      <div className="max-w-5xl mx-auto flex flex-col gap-6 mb-10">
        <div>
          {isFriendsTheme ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2 flex items-center flex-wrap">
              <span>S</span><span className="text-[#e50914] mx-1">•</span>
              <span>E</span><span className="text-[#2563eb] mx-1">•</span>
              <span>A</span><span className="text-[#eab308] mx-1">•</span>
              <span>R</span><span className="text-[#e50914] mx-1">•</span>
              <span>C</span><span className="text-[#2563eb] mx-1">•</span>
              <span>H</span>
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              Search Archive
            </h1>
          )}
          <p className="text-sm text-zinc-400 font-light">
            Find memories by keyword, squad member, place, or collection.
          </p>
        </div>

        {/* Input Bar */}
        <div className="relative w-full">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Search keywords, places, or tags (e.g. Naturals, Dosa, Udaipur)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-base sm:text-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-xl"
          />
          {query && (
            <button
              onClick={() => {
                soundFx.playClick();
                setQuery('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick Tag Suggestions */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-zinc-500 font-medium">Quick suggestions:</span>
          {SUGGESTED_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => {
                soundFx.playPop();
                setQuery(tag);
              }}
              className={`px-3 py-1 rounded-full border transition-all ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                  : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Interactive Filter Pills Area */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md flex flex-col gap-4">

          {/* Friend Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 w-24 flex-shrink-0">
              Friend:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedPerson('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedPerson === 'all'
                    ? 'bg-white text-zinc-950 shadow'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                All Friends
              </button>
              {allPeople.map(p => (
                <button
                  key={p}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedPerson(p);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedPerson === p
                      ? 'bg-white text-zinc-950 font-bold shadow'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${FRIEND_THEMES[p] || 'bg-red-500'}`} />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collection Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 w-24 flex-shrink-0">
              Collection:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCollection('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedCollection === 'all'
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                All Collections
              </button>
              {collections.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedCollection(c.id);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedCollection === c.id
                      ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_var(--accent-glow)]'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 w-24 flex-shrink-0">
              Mood:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSelectedMood('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedMood === 'all'
                    ? 'bg-[var(--accent)] text-white font-bold shadow-[0_0_12px_var(--accent-glow)]'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                All Moods
              </button>
              {allMoods.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedMood(m);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all capitalize ${
                    selectedMood === m
                      ? 'bg-[var(--accent)] text-white font-bold shadow-[0_0_12px_var(--accent-glow)]'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[var(--accent)] hover:underline text-xs font-semibold ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Search Result Header & Grid */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
          <div className="text-sm text-zinc-400 font-medium">
            Showing <strong className="text-white">{filteredMemories.length}</strong> matching stories
          </div>
        </div>

        {filteredMemories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMemories.map(memory => {
              const hasVideo = memory.assets?.some(a => a.endsWith('.mp4'));
              return (
                <div
                  key={memory.id}
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => {
                    soundFx.playPop();
                    navigate(`/memory/${memory.id}`);
                  }}
                  className="bg-zinc-900/70 hover:bg-zinc-900 border border-white/10 hover:border-[var(--accent)]/40 rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 group flex flex-col"
                >
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={memory.thumbnail}
                      alt={memory.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.8] group-hover:brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] uppercase font-bold tracking-wider text-zinc-300">
                      {hasVideo ? 'Video' : 'Photo'}
                    </div>

                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5 text-xs text-zinc-300">
                      <MapPin size={12} className="text-[var(--accent)]" />
                      <span>{memory.location}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                        <span>{new Date(memory.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                        <span className="capitalize">{memory.mood}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-white group-hover:text-[var(--accent)] transition-colors truncate">
                        {memory.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-light line-clamp-2 mt-1 leading-relaxed">
                        {memory.description}
                      </p>
                    </div>

                    {/* Tagged Friends */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                      {memory.people?.map(person => (
                        <span
                          key={person}
                          className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-medium text-zinc-300"
                        >
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 mb-4">
              <SearchIcon size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No matching stories found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mb-6 font-light">
              Try adjusting your search terms or clearing some of the filters to see more squad memories.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold shadow-md hover:bg-[var(--accent-hover)] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
