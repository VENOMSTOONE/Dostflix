import React, { useState, useEffect } from 'react';
import Hero from '../components/layout/Hero';
import MemoryRow from '../components/cards/MemoryRow';
import { collections } from '../data/memories';
import { useMemories } from '../context/MemoryContext';
import useFavorites from '../hooks/useFavorites';

export default function Home() {
  const { favorites, toggleFavorite } = useFavorites();
  const { memories } = useMemories();
  const [profile, setProfile] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('activeProfile');
    if (saved) setProfile(JSON.parse(saved));

    const savedProgressKeys = Object.keys(localStorage).filter(key => key.startsWith('DostFlix_progress_'));
    const items = savedProgressKeys.map(key => {
      const memoryId = key.replace('DostFlix_progress_', '');
      const data = JSON.parse(localStorage.getItem(key));
      const memory = memories.find(m => m.id === memoryId);
      if (memory) return { ...memory, progress: data.progress };
      return null;
    }).filter(Boolean);

    setContinueWatching(items);
  }, [memories]); // Added memories to dependency

  const featuredMemory = memories.find(m => m.featured) || memories[0];
  const personalSuggested = memories.filter(m => profile ? m.people?.includes(profile.name) : false);

  return (
    <div className="bg-background min-h-screen pb-20 select-none">
      <Hero featuredMemory={featuredMemory} />
      <div className="relative -mt-12 md:-mt-16 z-20">
        {profile && (
          <div className="px-6 md:px-12 mb-6">
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="text-red-500">{profile.name}</span>!
            </h2>
          </div>
        )}
        {continueWatching.length > 0 && <MemoryRow key="continue" title="Continue Watching" memories={continueWatching} favorites={favorites} onToggleFavorite={toggleFavorite} />}
        {personalSuggested.length > 0 && <MemoryRow key="personal" title={`Top Picks for ${profile?.name}`} memories={personalSuggested} favorites={favorites} onToggleFavorite={toggleFavorite} />}
        {collections.map(collection => (
          <MemoryRow key={collection.id} title={collection.title} memories={memories.filter(m => m.collectionId === collection.id)} favorites={favorites} onToggleFavorite={toggleFavorite} />
        ))}
        {favorites.length > 0 && <MemoryRow key="favorites" title="My Favorites" memories={memories.filter(m => favorites.includes(m.id))} favorites={favorites} onToggleFavorite={toggleFavorite} />}
      </div>
    </div>
  );
}
