import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { memories as baseMemories, collections as baseCollections } from '../data/memories';
import { useTheme } from './ThemeContext';
import { getAllMediaFiles, deleteMediaFile, updateMediaFile } from '../services/indexedDbStorage';

const MemoryContext = createContext();

const CUSTOM_MEMORIES_STORAGE_KEY = 'DostFlix_custom_memories';
const MEMORY_OVERRIDES_STORAGE_KEY = 'DostFlix_memory_overrides';
const DELETED_MEMORIES_STORAGE_KEY = 'DostFlix_deleted_memories';
const CUSTOM_COLLECTIONS_STORAGE_KEY = 'DostFlix_custom_collections';

export function MemoryProvider({ children }) {
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

  // Load custom memories from localStorage
  const [customMemories, setCustomMemories] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(CUSTOM_MEMORIES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (e) {
      console.warn('Failed to load custom memories:', e);
    }
    return [];
  });

  // Load modifications/overrides to any memories (base or custom)
  const [memoryOverrides, setMemoryOverrides] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(MEMORY_OVERRIDES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
      }
    } catch (e) {
      console.warn('Failed to load memory overrides:', e);
    }
    return {};
  });

  // Load deleted memory IDs
  const [deletedMemoryIds, setDeletedMemoryIds] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(DELETED_MEMORIES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (e) {
      console.warn('Failed to load deleted memories:', e);
    }
    return [];
  });

  // Load custom collections
  const [customCollections, setCustomCollections] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(CUSTOM_COLLECTIONS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (e) {
      console.warn('Failed to load custom collections:', e);
    }
    return [];
  });

  // Reactive IndexedDB Media Files state
  const [allMediaFiles, setAllMediaFiles] = useState([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  const refreshMedia = useCallback(async () => {
    try {
      setIsLoadingMedia(true);
      const files = await getAllMediaFiles();
      setAllMediaFiles(files);
    } catch (err) {
      console.warn('Error refreshing media from IndexedDB:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    refreshMedia();
  }, [refreshMedia]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_MEMORIES_STORAGE_KEY, JSON.stringify(customMemories));
    } catch (e) {
      console.warn('Error saving custom memories:', e);
    }
  }, [customMemories]);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_OVERRIDES_STORAGE_KEY, JSON.stringify(memoryOverrides));
    } catch (e) {
      console.warn('Error saving memory overrides:', e);
    }
  }, [memoryOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(DELETED_MEMORIES_STORAGE_KEY, JSON.stringify(deletedMemoryIds));
    } catch (e) {
      console.warn('Error saving deleted memory IDs:', e);
    }
  }, [deletedMemoryIds]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_COLLECTIONS_STORAGE_KEY, JSON.stringify(customCollections));
    } catch (e) {
      console.warn('Error saving custom collections:', e);
    }
  }, [customCollections]);

  // Derive consolidated active memories
  const rawMemories = useMemo(() => {
    const deletedSet = new Set(deletedMemoryIds);

    // Filter base memories that were not deleted, and apply overrides
    const processedBase = baseMemories
      .filter(m => !deletedSet.has(m.id))
      .map(m => {
        if (memoryOverrides[m.id]) {
          return { ...m, ...memoryOverrides[m.id] };
        }
        return m;
      });

    // Filter custom memories that were not deleted, and apply overrides
    const processedCustom = customMemories
      .filter(m => !deletedSet.has(m.id))
      .map(m => {
        if (memoryOverrides[m.id]) {
          return { ...m, ...memoryOverrides[m.id] };
        }
        return m;
      });

    return [...processedBase, ...processedCustom];
  }, [baseMemories, customMemories, memoryOverrides, deletedMemoryIds]);

  // Theme-aware titles transformation
  const memories = useMemo(() => {
    return rawMemories.map(m => ({
      ...m,
      title: isFriendsTheme && m.friendsTitle ? m.friendsTitle : m.title,
      originalTitle: m.title
    }));
  }, [rawMemories, isFriendsTheme]);

  // Collections list (base + custom)
  const collections = useMemo(() => {
    const combined = [...baseCollections, ...customCollections];
    return combined.map(c => ({
      ...c,
      title: isFriendsTheme && c.friendsTitle ? c.friendsTitle : c.title,
      originalTitle: c.title
    }));
  }, [baseCollections, customCollections, isFriendsTheme]);

  // Helper to re-evaluate mediaType based on asset URLs
  const evaluateMediaType = (assets = []) => {
    if (!assets || assets.length === 0) return 'image';
    const hasVideo = assets.some(a => typeof a === 'string' && a.match(/\.(mp4|mov|webm|m4v)(\?.*)?$/i));
    const hasImage = assets.some(a => typeof a === 'string' && !a.match(/\.(mp4|mov|webm|m4v)(\?.*)?$/i));
    if (hasVideo && hasImage) return 'mixed';
    if (hasVideo) return 'video';
    return 'image';
  };

  // 1. ADD A NEW MEMORY
  const addMemory = useCallback((newMemory) => {
    const memoryItem = {
      id: newMemory.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: newMemory.title || 'Untitled Memory',
      friendsTitle: newMemory.friendsTitle || `The One With ${newMemory.title || 'The Squad'}`,
      description: newMemory.description || '',
      date: newMemory.date || new Date().toISOString().split('T')[0],
      mediaType: newMemory.mediaType || evaluateMediaType(newMemory.assets),
      assets: newMemory.assets || [],
      thumbnail: newMemory.thumbnail || (newMemory.assets && newMemory.assets[0]) || '/WhatsApp Image 2026-07-30 at 6.42.12 PM.jpeg',
      tags: newMemory.tags || ['Squad', 'Memory'],
      people: newMemory.people || ['Vaibhav', 'Stuti', 'Lakshay'],
      location: newMemory.location || 'Squad Hangout',
      mood: newMemory.mood || 'happy',
      collectionId: newMemory.collectionId || 'coll-keepsakes',
      featured: Boolean(newMemory.featured),
      favorite: Boolean(newMemory.favorite),
      createdAt: new Date().toISOString(),
    };

    setCustomMemories(prev => [memoryItem, ...prev]);
    return memoryItem;
  }, []);

  // 2. UPDATE ANY MEMORY (Title, Description, Date, People, Location, Mood, Category, Cover, etc.)
  const updateMemory = useCallback((memoryId, updatedFields) => {
    setMemoryOverrides(prev => {
      const existingOverride = prev[memoryId] || {};
      const targetMemory = rawMemories.find(m => m.id === memoryId) || {};
      const mergedAssets = updatedFields.assets || existingOverride.assets || targetMemory.assets || [];

      const newOverride = {
        ...existingOverride,
        ...updatedFields,
        mediaType: updatedFields.assets ? evaluateMediaType(mergedAssets) : (updatedFields.mediaType || targetMemory.mediaType),
        updatedAt: new Date().toISOString()
      };

      return {
        ...prev,
        [memoryId]: newOverride
      };
    });
  }, [rawMemories]);

  // 3. DELETE A MEMORY
  const deleteMemory = useCallback(async (memoryId, shouldDeleteMedia = false) => {
    // Add to deleted list
    setDeletedMemoryIds(prev => [...new Set([...prev, memoryId])]);

    // Remove from custom memories if it exists there
    setCustomMemories(prev => prev.filter(m => m.id !== memoryId));

    // Clear overrides for this memory
    setMemoryOverrides(prev => {
      const copy = { ...prev };
      delete copy[memoryId];
      return copy;
    });

    // If requested, clean up associated media in IndexedDB
    if (shouldDeleteMedia) {
      try {
        const associatedMedia = allMediaFiles.filter(m => m.assignedMemoryId === memoryId);
        for (const item of associatedMedia) {
          await deleteMediaFile(item.id);
        }
        await refreshMedia();
      } catch (err) {
        console.warn('Error deleting associated media:', err);
      }
    }
  }, [allMediaFiles, refreshMedia]);

  // 4. ADD AN ASSET TO A MEMORY
  const addAssetToMemory = useCallback(async (memoryId, assetUrlOrMediaItem) => {
    const assetUrl = typeof assetUrlOrMediaItem === 'string' 
      ? assetUrlOrMediaItem 
      : (assetUrlOrMediaItem.thumbnail || assetUrlOrMediaItem.fileUrl);

    setMemoryOverrides(prev => {
      const targetMemory = rawMemories.find(m => m.id === memoryId);
      const existingAssets = (prev[memoryId]?.assets) || (targetMemory?.assets) || [];
      const updatedAssets = [...existingAssets, assetUrl];

      return {
        ...prev,
        [memoryId]: {
          ...(prev[memoryId] || {}),
          assets: updatedAssets,
          mediaType: evaluateMediaType(updatedAssets),
          updatedAt: new Date().toISOString()
        }
      };
    });

    // If it's an IndexedDB media item, link assignedMemoryId
    if (typeof assetUrlOrMediaItem === 'object' && assetUrlOrMediaItem.id) {
      try {
        await updateMediaFile(assetUrlOrMediaItem.id, { assignedMemoryId: memoryId });
        await refreshMedia();
      } catch (e) {
        console.warn('Failed to update media item assignedMemoryId:', e);
      }
    }
  }, [rawMemories, refreshMedia]);

  // 5. REMOVE AN ASSET FROM A MEMORY
  const removeAssetFromMemory = useCallback((memoryId, assetUrlToRemove) => {
    setMemoryOverrides(prev => {
      const targetMemory = rawMemories.find(m => m.id === memoryId);
      const existingAssets = (prev[memoryId]?.assets) || (targetMemory?.assets) || [];
      const updatedAssets = existingAssets.filter(a => a !== assetUrlToRemove);

      // If removed asset was the cover image, update cover to next available asset
      let newThumbnail = (prev[memoryId]?.thumbnail) || targetMemory?.thumbnail;
      if (newThumbnail === assetUrlToRemove && updatedAssets.length > 0) {
        newThumbnail = updatedAssets[0];
      }

      return {
        ...prev,
        [memoryId]: {
          ...(prev[memoryId] || {}),
          assets: updatedAssets,
          thumbnail: newThumbnail,
          mediaType: evaluateMediaType(updatedAssets),
          updatedAt: new Date().toISOString()
        }
      };
    });
  }, [rawMemories]);

  // 6. REORDER ASSETS IN A MEMORY
  const reorderAssets = useCallback((memoryId, newAssetsList) => {
    setMemoryOverrides(prev => ({
      ...prev,
      [memoryId]: {
        ...(prev[memoryId] || {}),
        assets: newAssetsList,
        mediaType: evaluateMediaType(newAssetsList),
        updatedAt: new Date().toISOString()
      }
    }));
  }, []);

  // 7. SET COVER IMAGE FOR A MEMORY
  const setCoverImage = useCallback((memoryId, newCoverUrl) => {
    setMemoryOverrides(prev => ({
      ...prev,
      [memoryId]: {
        ...(prev[memoryId] || {}),
        thumbnail: newCoverUrl,
        updatedAt: new Date().toISOString()
      }
    }));
  }, []);

  // 8. ADD A CUSTOM COLLECTION
  const addCollection = useCallback((collectionData) => {
    const newColl = {
      id: collectionData.id || `coll-${Date.now()}`,
      title: collectionData.title || 'New Collection',
      friendsTitle: collectionData.friendsTitle || `The One With ${collectionData.title}`,
      description: collectionData.description || '',
      accentColor: collectionData.accentColor || 'from-purple-600 to-indigo-900',
    };
    setCustomCollections(prev => [...prev, newColl]);
    return newColl;
  }, []);

  // Helper lookup
  const getMemory = useCallback((id) => {
    return memories.find(m => m.id === id);
  }, [memories]);

  const value = {
    memories,
    rawMemories,
    collections,
    allMediaFiles,
    isLoadingMedia,
    refreshMedia,
    addMemory,
    updateMemory,
    deleteMemory,
    addAssetToMemory,
    removeAssetFromMemory,
    reorderAssets,
    setCoverImage,
    addCollection,
    getMemory,
    isFriendsTheme
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
}

export const useMemories = () => useContext(MemoryContext);
