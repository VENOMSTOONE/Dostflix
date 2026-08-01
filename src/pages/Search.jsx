import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, SlidersHorizontal, Eye } from 'lucide-react';
import { memories, collections } from '../data/memories';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');

  // Extract all distinct moods and people
  const allMoods = useMemo(() => {
    const moods = memories.map(m => m.mood);
    return [...new Set(moods)];
  }, []);

  const allPeople = useMemo(() => {
    const people = memories.flatMap(m => m.people || []);
    return [...new Set(people)];
  }, []);

  const filteredMemories = useMemo(() => {
    return memories.filter(memory => {
      const matchQuery =
        memory.title.toLowerCase().includes(query.toLowerCase()) ||
        memory.description.toLowerCase().includes(query.toLowerCase()) ||
        memory.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));

      const matchMood = selectedMood ? memory.mood === selectedMood : true;
      const matchCollection = selectedCollection ? memory.collectionId === selectedCollection : true;
      const matchPerson = selectedPerson ? memory.people?.includes(selectedPerson) : true;

      return matchQuery && matchMood && matchCollection && matchPerson;
    });
  }, [query, selectedMood, selectedCollection, selectedPerson]);

  const clearFilters = () => {
    setQuery('');
    setSelectedMood('');
    setSelectedCollection('');
    setSelectedPerson('');
  };

  return (
    <div className="bg-background min-h-screen text-white px-6 md:px-12 py-12 md:py-20 select-none">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto flex flex-col gap-8 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">Search & Filter Memories</h1>

        {/* Input bar */}
        <div className="relative w-full">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={22} />
          <input
            type="text"
            placeholder="Search by keywords, tags, places..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-12 text-lg focus:outline-none focus:border-accent transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Sliders Option Row */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-primary/50 text-xs uppercase tracking-wider font-semibold">
            <SlidersHorizontal size={14} /> Filter By:
          </div>

          {/* Collection Select */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
          >
            <option value="">All Collections</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          {/* Mood Select */}
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white capitalize"
          >
            <option value="">All Moods</option>
            {allMoods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Person Select */}
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent text-white"
          >
            <option value="">All People</option>
            {allPeople.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {(query || selectedMood || selectedCollection || selectedPerson) && (
            <button onClick={clearFilters} className="text-accent text-sm hover:underline ml-auto">
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Search Result Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-baseline mb-6 border-b border-white/5 pb-3">
          <h2 className="text-xl font-bold">Search Results</h2>
          <span className="text-sm text-primary/40 font-semibold">{filteredMemories.length} match(es)</span>
        </div>

        {filteredMemories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMemories.map(memory => (
              <div
                key={memory.id}
                onClick={() => navigate(`/memory/${memory.id}`)}
                className="group bg-surface/40 hover:bg-surface border border-white/5 rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={memory.thumbnail}
                    alt={memory.title}
                    className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
                    {memory.mood}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white group-hover:text-accent transition-colors truncate mb-1">{memory.title}</h3>
                  <p className="text-xs text-primary/50 flex gap-1.5 items-center">
                    <span>{memory.location}</span>
                    <span>&bull;</span>
                    <span>{memory.date ? new Date(memory.date).getFullYear() : '2026'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-primary/45">
            <Eye size={40} className="mx-auto mb-4 text-primary/30" />
            <p className="text-lg">No memory fits this search filter.</p>
            <p className="text-sm mt-1">Try resetting the selection options or entering different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
