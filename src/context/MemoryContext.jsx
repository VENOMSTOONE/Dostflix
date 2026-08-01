import React, { createContext, useContext, useState, useEffect } from 'react';
import { memories as baseMemories, collections as baseCollections } from '../data/memories';

const MemoryContext = createContext();

export function MemoryProvider({ children }) {
  const [memories, setMemories] = useState([]);
  const [collections, setCollections] = useState(baseCollections);

  useEffect(() => {
    // Load custom memories from localStorage
    const saved = localStorage.getItem('DostFlix_custom_memories');
    const customMemories = saved ? JSON.parse(saved) : [];

    // Merge base memories with custom memories, ensuring custom ones take precedence or append
    setMemories([...baseMemories, ...customMemories]);
  }, []);

  const addMemory = (newMemory) => {
    const saved = localStorage.getItem('DostFlix_custom_memories');
    const customMemories = saved ? JSON.parse(saved) : [];
    const updated = [...customMemories, newMemory];
    localStorage.setItem('DostFlix_custom_memories', JSON.stringify(updated));
    setMemories([...baseMemories, ...updated]);
  };

  const addAssetToMemory = (memoryId, newAssetUrl) => {
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
      setMemories([...baseMemories, ...updated]);
    } else {
      // It's a base memory
      // We can store modifications to base memories in a separate key
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
      setMemories([...modifiedBase, ...customMemories]);
    }
  };

  return (
    <MemoryContext.Provider value={{ memories, collections, addMemory, addAssetToMemory }}>
      {children}
    </MemoryContext.Provider>
  );
}

export const useMemories = () => useContext(MemoryContext);
