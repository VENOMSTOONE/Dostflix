import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { memories as baseMemories, collections as baseCollections } from '../data/memories';
import { useTheme } from './ThemeContext';

const MemoryContext = createContext();

export function MemoryProvider({ children }) {
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

  const [rawMemories, setRawMemories] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('DostFlix_custom_memories');
        const customMemories = saved ? JSON.parse(saved) : [];
        const baseModsSaved = localStorage.getItem('DostFlix_base_mods');
        const baseMods = baseModsSaved ? JSON.parse(baseModsSaved) : {};

        const initialBase = baseMemories.map(m => {
          if (baseMods[m.id]) {
            return { ...m, assets: [...m.assets, ...baseMods[m.id]] };
          }
          return m;
        });

        return [...initialBase, ...customMemories];
      }
    } catch (e) {
      console.warn("Failed to load initial memories from localStorage:", e);
    }
    return baseMemories;
  });

  const addMemory = (newMemory) => {
    try {
      const saved = localStorage.getItem('DostFlix_custom_memories');
      const customMemories = saved ? JSON.parse(saved) : [];
      const updated = [...customMemories, newMemory];
      localStorage.setItem('DostFlix_custom_memories', JSON.stringify(updated));
      setRawMemories([...baseMemories, ...updated]);
    } catch (e) {
      console.warn("Error adding memory:", e);
    }
  };

  const addAssetToMemory = (memoryId, newAssetUrl) => {
    try {
      // Check if it's a custom memory or base memory
      const saved = localStorage.getItem('DostFlix_custom_memories');
      const customMemories = saved ? JSON.parse(saved) : [];
      const isCustom = customMemories.some(m => m.id === memoryId);

      if (isCustom) {
        const updated = customMemories.map(m => {
          if (m.id === memoryId) {
            return { ...m, assets: [...m.assets, newAssetUrl] };
          }
          return m;
        });
        localStorage.setItem('DostFlix_custom_memories', JSON.stringify(updated));
        setRawMemories([...baseMemories, ...updated]);
      } else {
        // It's a base memory
        const baseModsSaved = localStorage.getItem('DostFlix_base_mods') || '{}';
        const baseMods = JSON.parse(baseModsSaved);
        baseMods[memoryId] = baseMods[memoryId] || [];
        baseMods[memoryId].push(newAssetUrl);

        localStorage.setItem('DostFlix_base_mods', JSON.stringify(baseMods));

        // Apply mods to base list
        const modifiedBase = baseMemories.map(m => {
          if (baseMods[m.id]) {
            return { ...m, assets: [...m.assets, ...baseMods[m.id]] };
          }
          return m;
        });
        setRawMemories([...modifiedBase, ...customMemories]);
      }
    } catch (e) {
      console.warn("Error adding asset to memory:", e);
    }
  };

  // Transform titles automatically when in Friends theme
  const memories = useMemo(() => {
    return rawMemories.map(m => ({
      ...m,
      title: isFriendsTheme && m.friendsTitle ? m.friendsTitle : m.title,
      originalTitle: m.title
    }));
  }, [rawMemories, isFriendsTheme]);

  const collections = useMemo(() => {
    return baseCollections.map(c => ({
      ...c,
      title: isFriendsTheme && c.friendsTitle ? c.friendsTitle : c.title,
      originalTitle: c.title
    }));
  }, [isFriendsTheme]);

  return (
    <MemoryContext.Provider value={{ memories, collections, addMemory, addAssetToMemory, isFriendsTheme }}>
      {children}
    </MemoryContext.Provider>
  );
}

export const useMemories = () => useContext(MemoryContext);
