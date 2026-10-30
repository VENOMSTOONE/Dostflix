import React, { useState, useEffect } from 'react';
import Hero from '../components/layout/Hero';
import MemoryRow from '../components/cards/MemoryRow';
import { useMemories } from '../context/MemoryContext';
import useFavorites from '../hooks/useFavorites';

export default function Home() {
  const { favorites, toggleFavorite } = useFavorites();
  const { memories, collections } = useMemories();
  const [profile, setProfile] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  const [featuredMemory, setFeaturedMemory] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('activeProfile');
      if (saved) setProfile(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to parse activeProfile:", e);
    }

    try {
      const savedProgressKeys = Object.keys(localStorage).filter(key => key.startsWith('DostFlix_progress_'));
      const items = savedProgressKeys.map(key => {
        try {
          const memoryId = key.replace('DostFlix_progress_', '');
          const data = JSON.parse(localStorage.getItem(key));
          const memory = memories?.find(m => m.id === memoryId);
          if (memory) return { ...memory, progress: data?.progress || 0 };
        } catch (err) {}
        return null;
      }).filter(Boolean);

      setContinueWatching(items);
    } catch (e) {
      console.warn("Failed to load progress keys:", e);
    }

    // Pick a random featured memory every time the user opens/visits the page
    if (memories && memories.length > 0 && !featuredMemory) {
      const randomIndex = Math.floor(Math.random() * memories.length);
      setFeaturedMemory(memories[randomIndex]);
    }
  }, [memories]);

  const handleShuffleFeatured = () => {
    if (!memories || memories.length === 0) return;
    const currentIndex = memories.findIndex(m => m.id === featuredMemory?.id);
    let nextIndex = Math.floor(Math.random() * memories.length);
    if (nextIndex === currentIndex && memories.length > 1) {
      nextIndex = (currentIndex + 1) % memories.length;
    }
    setFeaturedMemory(memories[nextIndex]);
  };

  const personalSuggested = memories.filter(m => profile ? m.people?.includes(profile.name) : false);

  return (
    <div className="bg-background min-h-screen pb-20 select-none">
      <Hero
        featuredMemory={featuredMemory || memories[0]}
        onShuffle={handleShuffleFeatured}
      />

      <div className="relative -mt-12 md:-mt-16 z-20">
        {profile && (
          <div className="px-6 md:px-12 mb-6">
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="text-[var(--accent)] drop-shadow-[0_0_12px_var(--accent-glow)]">{profile.name}</span>!
            </h2>
          </div>
        )}

        {continueWatching.length > 0 && (
          <MemoryRow
            key="continue"
            title="Continue Watching"
            memories={continueWatching}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {personalSuggested.length > 0 && (
          <MemoryRow
            key="personal"
            title={`Top Picks for ${profile?.name}`}
            memories={personalSuggested}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {collections.map(collection => {
          const matching = memories.filter(m => m.collectionId === collection.id);
          if (matching.length === 0) return null;
          return (
            <MemoryRow
              key={collection.id}
              title={collection.title}
              memories={matching}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          );
        })}

        {/* Recently Added Studio Creations / Uncategorized */}
        {(() => {
          const uncategorized = memories.filter(m => !collections.some(c => c.id === m.collectionId));
          if (uncategorized.length === 0) return null;
          return (
            <MemoryRow
              key="studio-vault"
              title="Studio Vault & New Additions"
              memories={uncategorized}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          );
        })()}

        {favorites.length > 0 && (
          <MemoryRow
            key="favorites"
            title="My Favorites"
            memories={memories.filter(m => favorites.includes(m.id))}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </div>
    </div>
  );
}
