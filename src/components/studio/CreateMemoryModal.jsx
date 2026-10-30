import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Calendar, 
  MapPin, 
  Smile, 
  Users, 
  Tag, 
  Check, 
  Upload, 
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
  FolderPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useMemories } from '../../context/MemoryContext';
import soundFx from '../../utils/soundFx';
import confetti from 'canvas-confetti';

const SQUAD_MEMBERS = ['Vaibhav', 'Stuti', 'Lakshay'];
const MOODS = ['happy', 'funny', 'peaceful', 'emotional', 'energetic'];

export default function CreateMemoryModal({
  isOpen = false,
  initialFiles = [],
  onClose,
  onCreated,
}) {
  const { currentTheme } = useTheme();
  const { collections, addMemory, allMediaFiles } = useMemories();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [selectedPeople, setSelectedPeople] = useState(['Vaibhav', 'Stuti', 'Lakshay']);
  const [mood, setMood] = useState('happy');
  const [tagsInput, setTagsInput] = useState('Squad, Moments');
  const [collectionId, setCollectionId] = useState('coll-keepsakes');
  const [coverUrl, setCoverUrl] = useState('');
  const [attachedAssets, setAttachedAssets] = useState([]); // List of asset URLs/DataURLs
  const [formError, setFormError] = useState('');

  const fileUploadRef = useRef(null);

  // Initialize with any passed files
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      const urls = initialFiles.map(f => f.thumbnail || f.fileUrl).filter(Boolean);
      setAttachedAssets(urls);
      if (urls.length > 0) setCoverUrl(urls[0]);

      if (initialFiles[0]?.captureDate) {
        setDate(initialFiles[0].captureDate.split('T')[0]);
      }
      if (initialFiles[0]?.folderName) {
        setTitle(initialFiles[0].folderName.replace(/[-_]/g, ' '));
      }
    }
  }, [initialFiles]);

  if (!isOpen) return null;

  const togglePerson = (name) => {
    soundFx.playClick();
    setSelectedPeople(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  // Add files directly inside modal
  const handleDirectUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      soundFx.playPop();
      const newUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setAttachedAssets(prev => [...prev, ...newUrls]);
      if (!coverUrl && newUrls.length > 0) {
        setCoverUrl(newUrls[0]);
      }
    }
  };

  const handleSelectFromVault = (mediaItem) => {
    soundFx.playPop();
    const url = mediaItem.thumbnail || mediaItem.fileUrl;
    if (url && !attachedAssets.includes(url)) {
      setAttachedAssets(prev => [...prev, url]);
      if (!coverUrl) setCoverUrl(url);
    }
  };

  const handleRemoveAsset = (url) => {
    soundFx.playPop();
    setAttachedAssets(prev => prev.filter(a => a !== url));
    if (coverUrl === url) {
      const remaining = attachedAssets.filter(a => a !== url);
      setCoverUrl(remaining.length > 0 ? remaining[0] : '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a memory title.');
      return;
    }

    if (attachedAssets.length === 0) {
      setFormError('Please attach at least one photo or video to this memory.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newMemory = addMemory({
      title: title.trim(),
      description: description.trim() || '',
      date,
      location: location.trim() || '',
      people: selectedPeople.length > 0 ? selectedPeople : ['Vaibhav', 'Stuti', 'Lakshay'],
      mood,
      collectionId: collectionId || 'coll-keepsakes',
      tags: tags.length > 0 ? tags : ['Squad'],
      assets: attachedAssets,
      thumbnail: coverUrl || attachedAssets[0],
      featured: false,
      favorite: true,
    });

    soundFx.playPop();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    onCreated?.(newMemory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Sparkles size={14} />
              <span>Dostflix Studio Creator</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Create New Memory</h3>
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

        {/* Content Body: Form + Live Card Preview */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 7 cols: Inputs */}
            <div className="lg:col-span-7 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Memory Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Retro Arcade Face-Off"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
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
                  placeholder="Tell the backstory: who was there, what happened, the inside jokes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors resize-none"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none transition-colors"
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
                    placeholder="e.g. Naturals Ice Cream"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
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
                    Collection / Category
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
                    placeholder="e.g. Roadtrip, Laughter, Food"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

            </div>

            {/* Right 5 cols: LIVE HOMEPAGE CARD PREVIEW */}
            <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles size={12} style={{ color: currentTheme.colors.accent }} />
                <span>Live Homepage Card Preview</span>
              </span>

              {/* Realistic Dostflix Memory Card Mockup */}
              <div className="rounded-2xl overflow-hidden bg-zinc-950 border border-white/15 shadow-2xl relative aspect-[16/10] group">
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="w-full h-full object-cover brightness-[0.75]" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-600">
                    <ImageIcon size={32} className="mb-1" />
                    <span className="text-xs">No cover image selected</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">
                    {collections.find(c => c.id === collectionId)?.title || 'Memory'}
                  </span>
                  <h4 className="text-base font-bold text-white drop-shadow truncate">
                    {title || 'Untitled Memory'}
                  </h4>
                  <p className="text-xs text-zinc-300 truncate mt-0.5">
                    {date} {location ? `• ${location}` : ''}
                  </p>
                </div>

                {/* Badge showing media count */}
                <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-white border border-white/10">
                  {attachedAssets.length} items
                </div>
              </div>

              {/* Cover Selection Instructions */}
              <p className="text-[11px] text-zinc-400 italic">
                * Click on any attached photo below to designate it as the main cover image.
              </p>
            </div>

          </div>

          {/* Attached Media Section */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Attached Photos & Videos ({attachedAssets.length})
                </h4>
              </div>

              {/* Hidden direct upload input */}
              <input
                ref={fileUploadRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleDirectUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileUploadRef.current?.click()}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <Upload size={13} />
                <span>Upload More</span>
              </button>
            </div>

            {/* Visual Gallery of Attached Assets */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {attachedAssets.map((assetUrl, idx) => {
                const isCover = coverUrl === assetUrl;
                return (
                  <div
                    key={idx}
                    onClick={() => setCoverUrl(assetUrl)}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 transition-all ${
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAsset(assetUrl);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow"
                      title="Remove from memory"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              style={{ backgroundColor: currentTheme.colors.accent }}
            >
              <Check size={15} />
              <span>Create Memory</span>
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
