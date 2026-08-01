import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Calendar, MapPin, Smile, ArrowLeft, Heart, Sparkles, User, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { memories, collections } from '../data/memories';
import useFavorites from '../hooks/useFavorites';
import CinemaPlayer from '../components/player/CinemaPlayer';

export default function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { favorites, toggleFavorite } = useFavorites();

  const [activeMedia, setActiveMedia] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Find memory details
  const memory = memories.find(m => m.id === id);
  if (!memory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-background">
        <HelpCircle size={48} className="text-zinc-500 mb-4" />
        <h2 className="text-2xl font-bold">Memory not found</h2>
        <button onClick={() => navigate('/home')} className="mt-4 px-6 py-2 bg-accent text-zinc-950 font-bold rounded-full">
          Go Home
        </button>
      </div>
    );
  }

  const isFavorite = favorites.includes(memory.id);

  // Auto-launch play if specified in URL query params
  useEffect(() => {
    if (searchParams.get('play') === 'true') {
      const videoAsset = memory.assets.find(asset => asset.endsWith('.mp4')) || memory.assets[0];
      if (videoAsset) {
        setActiveMedia(videoAsset);
        setIsPlayerOpen(true);
      }
    }
  }, [searchParams, id, memory]);

  // Related memories from the same collection
  const related = memories.filter(m => m.collectionId === memory.collectionId && m.id !== memory.id);
  const collection = collections.find(c => c.id === memory.collectionId);

  const startPlayer = (asset) => {
    setActiveMedia(asset);
    setIsPlayerOpen(true);
  };

  return (
    <div className="bg-background min-h-screen text-white pb-20 select-none">
      {/* Top Banner Cover */}
      <div className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            src={memory.thumbnail}
            alt={memory.title}
            className="w-full h-full object-cover brightness-[0.55]"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1.0 }}
            transition={{ duration: 1.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          className="absolute top-6 left-6 md:left-12 flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/30 transition-all active:scale-95 backdrop-blur-md text-white z-10"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-semibold">Back</span>
        </button>

        {/* Floating Banner Title */}
        <div className="absolute bottom-[8%] left-0 w-full px-6 md:px-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="text-xs md:text-sm font-bold tracking-wider text-accent uppercase mb-2">
              {collection?.title || 'Collection'}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 drop-shadow-md">
              {memory.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-primary/70">
              <span className="flex items-center gap-1.5"><Calendar size={16} /> {memory.date ? new Date(memory.date).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</span>
              <span className="flex items-center gap-1.5"><MapPin size={16} /> {memory.location}</span>
              <span className="flex items-center gap-1.5 capitalize"><Smile size={16} /> {memory.mood}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Grid Info Section */}
      <div className="px-6 md:px-12 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Memory Details Description & Metadata */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div>
            <h3 className="text-lg font-bold text-primary/40 uppercase tracking-widest mb-3">The Story</h3>
            <p className="text-base md:text-lg text-primary/80 leading-relaxed font-light font-serif">
              {memory.description}
            </p>
          </div>

          {/* People list */}
          {memory.people && (
            <div>
              <h3 className="text-sm font-bold text-primary/40 uppercase tracking-widest mb-3">People in it</h3>
              <div className="flex flex-wrap gap-3">
                {memory.people.map(person => (
                  <span key={person} className="flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm font-medium text-white/95">
                    <User size={14} className="text-accent" />
                    {person}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <h3 className="text-sm font-bold text-primary/40 uppercase tracking-widest mb-3">Tags & Elements</h3>
            <div className="flex flex-wrap gap-2">
              {memory.tags.map(tag => (
                <span key={tag} className="bg-primary/5 hover:bg-primary/10 border border-primary/10 px-3 py-1 rounded text-xs text-primary/60 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Favorite & Quick play sidebar */}
        <div className="flex flex-col gap-6 bg-surface/50 border border-white/5 p-6 rounded-2xl h-fit">
          <h4 className="font-bold text-lg text-white">Memory Control</h4>
          <p className="text-xs text-primary/50">Save this memory, play it in Cinema Mode, or share.</p>

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => {
                const mainAsset = memory.assets.find(asset => asset.endsWith('.mp4')) || memory.assets[0];
                startPlayer(mainAsset);
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-accent hover:text-black transition-colors"
            >
              <Play size={18} fill="currentColor" />
              <span>Full Screen Play</span>
            </button>

            <button
              onClick={() => toggleFavorite(memory.id)}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                  : 'border-white/15 text-white hover:bg-white/5'
              }`}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              <span>{isFavorite ? 'Removed from Favs' : 'Add to Favorites'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Media Collection Gallery */}
      <div className="px-6 md:px-12 mt-16">
        <h3 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6 flex items-center gap-2">
          <Sparkles size={20} className="text-accent" />
          Media Collection
        </h3>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {memory.assets.map((asset, index) => {
            const isVideo = asset.endsWith('.mp4');
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => startPlayer(asset)}
                className="relative aspect-video rounded-xl overflow-hidden bg-surface border border-white/5 cursor-pointer group shadow-lg"
              >
                {isVideo ? (
                  <video src={asset} className="w-full h-full object-cover brightness-[0.7] group-hover:brightness-[0.85] transition-all" muted playsInline />
                ) : (
                  <img src={asset} alt={`Asset ${index}`} className="w-full h-full object-cover brightness-[0.7] group-hover:brightness-[0.9] transition-all" />
                )}
                {/* Play Badge Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-md border border-white/40">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Related Section */}
      {related.length > 0 && (
        <div className="px-6 md:px-12 mt-20 border-t border-white/5 pt-12">
          <h3 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6">
            More from {collection?.title}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(rel => (
              <div
                key={rel.id}
                onClick={() => {
                  navigate(`/memory/${rel.id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-surface mb-2 border border-white/5">
                  <img src={rel.thumbnail} alt={rel.title} className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h4 className="font-semibold text-sm text-primary/80 group-hover:text-white transition-colors">{rel.title}</h4>
                <p className="text-xs text-primary/50">{rel.location}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cinema Mode Player overlay */}
      <CinemaPlayer isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} mediaAsset={activeMedia} memoryId={memory.id} />
    </div>
  );
}
