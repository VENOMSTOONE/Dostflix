import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  MapPin, 
  Smile, 
  Users, 
  Tag, 
  Sparkles, 
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useMemories } from '../../context/MemoryContext';
import soundFx from '../../utils/soundFx';

const SQUAD_MEMBERS = ['Vaibhav', 'Stuti', 'Lakshay'];
const MOODS = ['happy', 'funny', 'peaceful', 'emotional', 'energetic'];

export default function EditMemoryModal({
  memory,
  isOpen = false,
  onClose,
  onSaved,
}) {
  const { currentTheme } = useTheme();
  const { collections, updateMemory } = useMemories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [mood, setMood] = useState('happy');
  const [tagsInput, setTagsInput] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setDescription(memory.description || '');
      setDate(memory.date ? memory.date.split('T')[0] : '');
      setLocation(memory.location || '');
      setSelectedPeople(memory.people || ['Vaibhav', 'Stuti', 'Lakshay']);
      setMood(memory.mood || 'happy');
      setTagsInput(Array.isArray(memory.tags) ? memory.tags.join(', ') : '');
      setCollectionId(memory.collectionId || 'coll-keepsakes');
      setCoverUrl(memory.thumbnail || '');
    }
  }, [memory]);

  if (!isOpen || !memory) return null;

  const togglePerson = (name) => {
    soundFx.playClick();
    setSelectedPeople(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a memory title.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    updateMemory(memory.id, {
      title: title.trim(),
      description: description.trim(),
      date,
      location: location.trim(),
      people: selectedPeople,
      mood,
      collectionId,
      tags,
      thumbnail: coverUrl || memory.thumbnail,
    });

    soundFx.playPop();
    onSaved?.();
    onClose();
  };

  const assets = memory.assets || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-950/40">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1 block">
              Customize Memory
            </span>
            <h3 className="text-xl font-bold text-white">Edit "{memory.title}"</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-sm text-white focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Story / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* People & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                People Present
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SQUAD_MEMBERS.map(name => {
                  const isSelected = selectedPeople.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => togglePerson(name)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-white text-zinc-950 font-bold shadow'
                          : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none capitalize"
              >
                {MOODS.map(m => (
                  <option key={m} value={m} className="capitalize">{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Collection & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none"
              >
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Cover Selector from existing assets */}
          {assets.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Choose Cover Image
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {assets.map((assetUrl, idx) => {
                  const isCover = coverUrl === assetUrl;
                  return (
                    <div
                      key={idx}
                      onClick={() => setCoverUrl(assetUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isCover 
                          ? 'border-emerald-400 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={assetUrl} alt="" className="w-full h-full object-cover" />
                      {isCover && (
                        <span className="absolute bottom-1 left-1 bg-emerald-500 text-zinc-950 font-black text-[9px] px-1.5 py-0.2 rounded shadow">
                          COVER
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-xs text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              style={{ backgroundColor: currentTheme.colors.accent }}
            >
              <Check size={14} />
              <span>Save Changes</span>
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
