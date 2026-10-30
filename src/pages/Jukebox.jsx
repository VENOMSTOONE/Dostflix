import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Plus, 
  Play, 
  Heart, 
  ExternalLink, 
  Sparkles, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Coffee, 
  Car, 
  Moon, 
  Laptop, 
  Radio, 
  Check, 
  X,
  Quote,
  Edit3,
  Settings,
  Flame,
  Compass,
  RefreshCw,
  Disc,
  ListMusic,
  Palette,
  SlidersHorizontal,
  FolderPlus,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { useMusic } from '../context/AudioContext';
import soundFx from '../utils/soundFx';

// Icon Map for Dynamic Moods stored in LocalStorage
export const MOOD_ICONS = {
  Coffee: Coffee,
  Car: Car,
  Sparkles: Sparkles,
  Flame: Flame,
  Moon: Moon,
  Radio: Radio,
  Music: Music,
  Compass: Compass,
  Heart: Heart,
  Disc: Disc
};

export const COLOR_PALETTE = [
  { name: 'Yellow Gold', value: '#eab308' },
  { name: 'Ocean Blue', value: '#3b82f6' },
  { name: 'Sunset Orange', value: '#f97316' },
  { name: 'Hot Pink', value: '#ec4899' },
  { name: 'Electric Purple', value: '#a855f7' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Rose Red', value: '#f43f5e' },
  { name: 'Cyan Breeze', value: '#06b6d4' }
];

// Smart Spotify URL Parser supporting tracks, playlists, albums, and iframes
export function parseSpotifyUrl(input) {
  if (!input) return null;
  const trimmed = input.trim();
  
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  const target = iframeMatch ? iframeMatch[1] : trimmed;

  const uriMatch = target.match(/spotify:(track|playlist|album|artist):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    return {
      type: uriMatch[1],
      id: uriMatch[2],
      embedUrl: `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?utm_source=generator&theme=0`,
      webUrl: `https://open.spotify.com/${uriMatch[1]}/${uriMatch[2]}`
    };
  }

  const webMatch = target.match(/open\.spotify\.com\/(?:embed\/)?(?:intl-[a-z]{2,5}\/)?(track|playlist|album|artist)\/([a-zA-Z0-9]+)/i);
  if (webMatch) {
    return {
      type: webMatch[1],
      id: webMatch[2],
      embedUrl: `https://open.spotify.com/embed/${webMatch[1]}/${webMatch[2]}?utm_source=generator&theme=0`,
      webUrl: `https://open.spotify.com/${webMatch[1]}/${webMatch[2]}`
    };
  }

  return null;
}

export const DEFAULT_MOODS = [
  {
    id: 'central-perk',
    label: "Central Perk",
    title: "Central Perk Acoustic Vibes",
    subtitle: "Acoustic coffeehouse & F·R·I·E·N·D·S comfort",
    type: 'track',
    spotifyUrl: 'https://open.spotify.com/track/15tHagkk8z306XkyOHqiip',
    embedUrl: 'https://open.spotify.com/embed/track/15tHagkk8z306XkyOHqiip?utm_source=generator&theme=0',
    color: '#eab308',
    iconName: 'Coffee',
    mood: 'Sitcom',
    sharedBy: 'Squad',
    memory: "Our favorite coffee hangout anthem. The 4 claps are mandatory!",
    isPermanent: true
  },
  {
    id: 'bollywood-roadtrip',
    label: "Bollywood Roadtrip",
    title: "Hass Hass • Roadtrip Anthem",
    subtitle: "Full volume, windows rolled down, singing loud on the NH48",
    type: 'track',
    spotifyUrl: 'https://open.spotify.com/track/72vuBPMhwFNlSYpTSf6fVD',
    embedUrl: 'https://open.spotify.com/embed/track/72vuBPMhwFNlSYpTSf6fVD?utm_source=generator&theme=0',
    color: '#3b82f6',
    iconName: 'Car',
    mood: 'Roadtrip',
    sharedBy: 'Lakshay',
    memory: "The 200km stretch to Udaipur with full blast speakers!"
  },
  {
    id: 'chai-sukoon',
    label: "Chai & Sukoon",
    title: "Sajni • Soulful Acoustic Chai Vibe",
    subtitle: "Warm chai, slow evenings, and heart-to-heart conversations",
    type: 'track',
    spotifyUrl: 'https://open.spotify.com/track/5zCnGtCl5Ac5zlFHXaZmhy',
    embedUrl: 'https://open.spotify.com/embed/track/5zCnGtCl5Ac5zlFHXaZmhy?utm_source=generator&theme=0',
    color: '#f97316',
    iconName: 'Sparkles',
    mood: 'Chai & Sukoon',
    sharedBy: 'Stuti',
    memory: "Sitting on the steps with hot cutting chai talking about life."
  },
  {
    id: 'desi-party',
    label: "Desi Party",
    title: "Sajna • High Energy Desi Beats",
    subtitle: "Unstoppable dance energy, goofy moves, and celebration chaos",
    type: 'track',
    spotifyUrl: 'https://open.spotify.com/track/3YV4Go0hpYXjGTGLJXjfda',
    embedUrl: 'https://open.spotify.com/embed/track/3YV4Go0hpYXjGTGLJXjfda?utm_source=generator&theme=0',
    color: '#ec4899',
    iconName: 'Flame',
    mood: 'Party',
    sharedBy: 'Lakshay',
    memory: "Dancing like crazy when the party hit 1 AM!"
  },
  {
    id: 'latenight-talks',
    label: "2 AM Talks",
    title: "Saware • Midnight Terrace Talks",
    subtitle: "Late-night nostalgia, terrace breeze, and deep squad bonding",
    type: 'track',
    spotifyUrl: 'https://open.spotify.com/track/1juJ3mwsFerctbngtK42G4',
    embedUrl: 'https://open.spotify.com/embed/track/1juJ3mwsFerctbngtK42G4?utm_source=generator&theme=0',
    color: '#a855f7',
    iconName: 'Moon',
    mood: '2 AM Talks',
    sharedBy: 'Vaibhav',
    memory: "Terrace talks after midnight when everyone opened up."
  },
  {
    id: 'ice-cream',
    label: "Ice Cream Run",
    title: "Kesariya (Remix) • Naturals Run",
    subtitle: "Sweet upbeat moments from mango scoops to evening walks",
    type: 'track',
    spotifyUrl: 'https://open.spotify.com/track/5XxPmpokiWT8kqrOGDvvxU',
    embedUrl: 'https://open.spotify.com/embed/track/5XxPmpokiWT8kqrOGDvvxU?utm_source=generator&theme=0',
    color: '#10b981',
    iconName: 'Sparkles',
    mood: 'Ice Cream',
    sharedBy: 'Stuti',
    memory: "Always played while fighting over who gets the last bite of Naturals ice cream."
  }
];

const INITIAL_SONGS = [
  {
    id: 'song-1',
    title: "I'll Be There for You",
    artist: "The Rembrandts",
    sharedBy: "Vaibhav",
    avatarColor: "bg-emerald-500",
    mood: "Sitcom",
    memory: "Our official squad promise: when the rain starts to fall, we got each other's backs.",
    spotifyUrl: "https://open.spotify.com/track/15tHagkk8z306XkyOHqiip",
    embedUrl: "https://open.spotify.com/embed/track/15tHagkk8z306XkyOHqiip?utm_source=generator&theme=0",
    likes: 12
  },
  {
    id: 'song-2',
    title: "Sajni",
    artist: "Arijit Singh & Ram Sampath",
    sharedBy: "Stuti",
    avatarColor: "bg-rose-500",
    mood: "Chai & Sukoon",
    memory: "The peaceful melody playing while having cutting chai and talking about life.",
    spotifyUrl: "https://open.spotify.com/track/5zCnGtCl5Ac5zlFHXaZmhy",
    embedUrl: "https://open.spotify.com/embed/track/5zCnGtCl5Ac5zlFHXaZmhy?utm_source=generator&theme=0",
    likes: 14
  },
  {
    id: 'song-3',
    title: "Hass Hass",
    artist: "Diljit Dosanjh & Sia",
    sharedBy: "Lakshay",
    avatarColor: "bg-blue-500",
    mood: "Roadtrip",
    memory: "Screaming the lyrics with full bass on the open highway to Udaipur!",
    spotifyUrl: "https://open.spotify.com/track/72vuBPMhwFNlSYpTSf6fVD",
    embedUrl: "https://open.spotify.com/embed/track/72vuBPMhwFNlSYpTSf6fVD?utm_source=generator&theme=0",
    likes: 10
  },
  {
    id: 'song-4',
    title: "Saware",
    artist: "Arijit Singh & Pritam",
    sharedBy: "Vaibhav",
    avatarColor: "bg-emerald-500",
    mood: "2 AM Talks",
    memory: "3:45 AM deep conversations on the terrace when nobody wanted to sleep.",
    spotifyUrl: "https://open.spotify.com/track/1juJ3mwsFerctbngtK42G4",
    embedUrl: "https://open.spotify.com/embed/track/1juJ3mwsFerctbngtK42G4?utm_source=generator&theme=0",
    likes: 11
  },
  {
    id: 'song-5',
    title: "Kesariya (Remix)",
    artist: "Pritam & Arijit Singh",
    sharedBy: "Stuti",
    avatarColor: "bg-rose-500",
    mood: "Ice Cream",
    memory: "The sweet upbeat energy playing on the drive back from Naturals Ice Cream.",
    spotifyUrl: "https://open.spotify.com/track/5XxPmpokiWT8kqrOGDvvxU",
    embedUrl: "https://open.spotify.com/embed/track/5XxPmpokiWT8kqrOGDvvxU?utm_source=generator&theme=0",
    likes: 9
  },
  {
    id: 'song-6',
    title: "Heeriye",
    artist: "Jasleen Royal & Arijit Singh",
    sharedBy: "Lakshay",
    avatarColor: "bg-blue-500",
    mood: "Chai & Sukoon",
    memory: "Watching the sun dip below the horizon after laughing for three hours straight.",
    spotifyUrl: "https://open.spotify.com/track/5PUXKVVVQ74C3gl5vKy9Li",
    embedUrl: "https://open.spotify.com/embed/track/5PUXKVVVQ74C3gl5vKy9Li?utm_source=generator&theme=0",
    likes: 13
  }
];

const PROFILES = [
  { name: 'Vaibhav', color: 'bg-emerald-500' },
  { name: 'Stuti', color: 'bg-rose-500' },
  { name: 'Lakshay', color: 'bg-blue-500' },
  { name: 'Squad', color: 'bg-amber-500' }
];

const SONGS_STORAGE_KEY = 'dostflix_jukebox_tracks_v4';
const MOODS_STORAGE_KEY = 'dostflix_jukebox_moods_v2';

export default function Jukebox() {
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';
  const { isPlaying: isBgAudioPlaying, pauseMusic: pauseBgMusic, resumeMusic: resumeBgMusic } = useMusic();

  // Load custom/preset moods from localStorage
  const [moods, setMoods] = useState(() => {
    try {
      const saved = localStorage.getItem(MOODS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load jukebox moods:", e);
    }
    return DEFAULT_MOODS;
  });

  const [activeDeck, setActiveDeck] = useState(() => moods[0] || DEFAULT_MOODS[0]);
  const [selectedMood, setSelectedMood] = useState('All');
  const [isFullPlayerView, setIsFullPlayerView] = useState(false);

  // Collaborative songs list in localStorage
  const [songs, setSongs] = useState(() => {
    try {
      const saved = localStorage.getItem(SONGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to load jukebox songs:", e);
    }
    return INITIAL_SONGS;
  });

  // Modals state
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingMood, setEditingMood] = useState(null); // When editing a mood

  // Form states: Add Song
  const [formUrl, setFormUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formSharedBy, setFormSharedBy] = useState('Vaibhav');
  const [formMemory, setFormMemory] = useState('');
  const [formMood, setFormMood] = useState('Roadtrip');
  const [formError, setFormError] = useState('');

  // Form states: Import Spotify Playlist / New Mood
  const [importUrl, setImportUrl] = useState('');
  const [importLabel, setImportLabel] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importSubtitle, setImportSubtitle] = useState('');
  const [importColor, setImportColor] = useState('#3b82f6');
  const [importIcon, setImportIcon] = useState('Music');
  const [importMoodCategory, setImportMoodCategory] = useState('');
  const [importSharedBy, setImportSharedBy] = useState('Squad');
  const [importMemory, setImportMemory] = useState('');
  const [importError, setImportError] = useState('');
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  // Sync Moods to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MOODS_STORAGE_KEY, JSON.stringify(moods));
    } catch (e) {
      console.warn("Failed to persist jukebox moods:", e);
    }
  }, [moods]);

  // Sync Songs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(songs));
    } catch (e) {
      console.warn("Failed to persist jukebox songs:", e);
    }
  }, [songs]);

  // Dynamic Mood categories for filtering
  const dynamicMoodCategories = ['All', ...new Set(moods.map(m => m.mood || m.label).filter(Boolean))];

  const isTrack = activeDeck?.type === 'track';
  const playerHeight = isTrack ? 152 : (isFullPlayerView ? 352 : 152);

  const handleLoadTrack = (item) => {
    soundFx.playClick();
    setActiveDeck({
      id: item.id,
      title: item.title || item.label,
      type: item.type || (item.embedUrl?.includes('/playlist/') ? 'playlist' : 'track'),
      artist: item.artist || item.subtitle,
      subtitle: item.subtitle,
      embedUrl: item.embedUrl,
      spotifyUrl: item.spotifyUrl,
      sharedBy: item.sharedBy,
      memory: item.memory,
      mood: item.mood || item.label,
      color: item.color || currentTheme.colors.accent,
      iconName: item.iconName || 'Music'
    });
  };

  const handleLike = (id, e) => {
    e.stopPropagation();
    soundFx.playPop();
    setSongs(prev => prev.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s));
  };

  const handleRemoveSong = (id, e) => {
    e.stopPropagation();
    soundFx.playPop();
    setSongs(prev => prev.filter(s => s.id !== id));
  };

  // Add Memory Track
  const handleAddSong = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formUrl.trim()) {
      setFormError('Please enter a Spotify track or playlist URL.');
      return;
    }

    const parsed = parseSpotifyUrl(formUrl);
    if (!parsed) {
      setFormError('Invalid link. Please paste a valid open.spotify.com URL.');
      return;
    }

    if (!formTitle.trim()) {
      setFormError('Please provide a song title.');
      return;
    }

    const selectedProfileObj = PROFILES.find(p => p.name === formSharedBy) || PROFILES[0];

    const newSong = {
      id: `song-${Date.now()}`,
      title: formTitle.trim(),
      artist: formArtist.trim() || 'Spotify Track',
      sharedBy: formSharedBy,
      avatarColor: selectedProfileObj.color,
      mood: formMood,
      memory: formMemory.trim() || "A cherished track in our shared memory vault.",
      spotifyUrl: parsed.webUrl,
      embedUrl: parsed.embedUrl,
      likes: 1
    };

    setSongs(prev => [newSong, ...prev]);
    handleLoadTrack(newSong);

    soundFx.playPop();
    if (isFriendsTheme) soundFx.playFriendsClap();

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    setFormUrl('');
    setFormTitle('');
    setFormArtist('');
    setFormMemory('');
    setIsAddSongOpen(false);
  };

  // Auto-fetch metadata via Spotify oEmbed when URL is entered in Import Playlist modal
  const handleImportUrlChange = async (url) => {
    setImportUrl(url);
    setImportError('');
    if (!url.trim()) return;

    const parsed = parseSpotifyUrl(url);
    if (!parsed) return;

    // Default autofill based on type
    if (parsed.type === 'playlist') {
      setImportIcon('ListMusic');
    }

    // Try fetching oEmbed metadata
    try {
      setIsFetchingMeta(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url.trim())}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.title && !importTitle) {
          setImportTitle(data.title);
          // Auto create a concise label from title if empty
          if (!importLabel) {
            const shortLabel = data.title.split('•')[0].split('-')[0].trim().slice(0, 20);
            setImportLabel(shortLabel || "New Playlist");
          }
        }
        if (data.author_name && !importSubtitle) {
          setImportSubtitle(`Curated by ${data.author_name}`);
        }
      }
    } catch (err) {
      // Non-blocking: user can still fill details manually
      console.log("Spotify oEmbed skipped or timed out:", err);
    } finally {
      setIsFetchingMeta(false);
    }
  };

  // Submit Import / Save New Mood
  const handleSaveMood = (e) => {
    e.preventDefault();
    setImportError('');

    if (!importUrl.trim()) {
      setImportError('Please enter a Spotify playlist or track link.');
      return;
    }

    const parsed = parseSpotifyUrl(importUrl);
    if (!parsed) {
      setImportError('Invalid Spotify URL. Please paste a valid open.spotify.com link.');
      return;
    }

    const label = importLabel.trim() || importTitle.trim() || 'New Mood';
    const title = importTitle.trim() || label;
    const moodCat = importMoodCategory.trim() || label;

    if (editingMood) {
      // Updating an existing mood
      const updatedMood = {
        ...editingMood,
        label,
        title,
        subtitle: importSubtitle.trim() || 'Custom squad listening vibe',
        type: parsed.type,
        spotifyUrl: parsed.webUrl,
        embedUrl: parsed.embedUrl,
        color: importColor,
        iconName: importIcon,
        mood: moodCat,
        sharedBy: importSharedBy,
        memory: importMemory.trim() || editingMood.memory || 'Our curated playlist.'
      };

      setMoods(prev => prev.map(m => m.id === editingMood.id ? updatedMood : m));

      if (activeDeck?.id === editingMood.id) {
        handleLoadTrack(updatedMood);
      }

      soundFx.playPop();
      setEditingMood(null);
      setIsImportModalOpen(false);
      return;
    }

    // Creating a fresh new mood / imported playlist
    const newMood = {
      id: `mood-${Date.now()}`,
      label,
      title,
      subtitle: importSubtitle.trim() || `Spotify ${parsed.type} added to the lounge`,
      type: parsed.type,
      spotifyUrl: parsed.webUrl,
      embedUrl: parsed.embedUrl,
      color: importColor,
      iconName: importIcon,
      mood: moodCat,
      sharedBy: importSharedBy,
      memory: importMemory.trim() || `Imported ${parsed.type} shared with the squad.`
    };

    setMoods(prev => [...prev, newMood]);
    handleLoadTrack(newMood);

    soundFx.playPop();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    // Reset Form
    setImportUrl('');
    setImportLabel('');
    setImportTitle('');
    setImportSubtitle('');
    setImportMemory('');
    setImportMoodCategory('');
    setIsImportModalOpen(false);
  };

  // Open Edit Mode for an existing mood
  const handleOpenEditMood = (moodObj) => {
    soundFx.playPop();
    setEditingMood(moodObj);
    setImportUrl(moodObj.spotifyUrl || '');
    setImportLabel(moodObj.label || '');
    setImportTitle(moodObj.title || '');
    setImportSubtitle(moodObj.subtitle || '');
    setImportColor(moodObj.color || '#3b82f6');
    setImportIcon(moodObj.iconName || 'Music');
    setImportMoodCategory(moodObj.mood || '');
    setImportSharedBy(moodObj.sharedBy || 'Squad');
    setImportMemory(moodObj.memory || '');
    setImportError('');
    setIsImportModalOpen(true);
  };

  // Delete a mood
  const handleDeleteMood = (moodId) => {
    soundFx.playPop();
    setMoods(prev => {
      const filtered = prev.filter(m => m.id !== moodId);
      // If deleted mood was active, switch to first remaining
      if (activeDeck?.id === moodId) {
        if (filtered.length > 0) {
          handleLoadTrack(filtered[0]);
        }
      }
      return filtered;
    });
  };

  // Reset to default moods
  const handleResetDefaultMoods = () => {
    soundFx.playPop();
    setMoods(DEFAULT_MOODS);
    handleLoadTrack(DEFAULT_MOODS[0]);
    confetti({ particleCount: 30, spread: 50 });
  };

  const filteredSongs = selectedMood === 'All' 
    ? songs 
    : songs.filter(s => s.mood.toLowerCase() === selectedMood.toLowerCase());

  const activeColor = activeDeck?.color || currentTheme.colors.accent;

  return (
    <div className="bg-[#09090b] min-h-screen text-white px-4 sm:px-8 md:px-16 py-8 md:py-12 relative overflow-x-hidden">
      
      {/* Atmospheric Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] rounded-full blur-[180px] pointer-events-none -z-10 transition-colors duration-1000 opacity-20"
        style={{ backgroundColor: activeColor }}
      />

      {/* HEADER SECTION: Clean, Studio Aesthetic */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-white/[0.06]">
        <div>
          {isFriendsTheme ? (
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-yellow-400/90 mb-2">
              <Coffee size={14} />
              <span>Central Perk Listening Lounge</span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase mb-2"
              style={{ color: currentTheme.colors.accent }}
            >
              <Radio size={14} />
              <span>DostFlix Studio</span>
            </div>
          )}

          {isFriendsTheme ? (
            <div className="flex items-center text-3xl sm:text-4xl font-black tracking-widest text-white mb-2">
              <span>J</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-1" />
              <span>U</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-1" />
              <span>K</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mx-1" />
              <span>E</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-1" />
              <span>B</span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mx-1" />
              <span>O</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-1" />
              <span>X</span>
            </div>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Squad Jukebox
            </h1>
          )}

          <p className="text-zinc-400 text-sm max-w-xl font-normal leading-relaxed">
            Our shared soundtrack. Switch moods, import playlists directly from Spotify, and attach songs to squad memories.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Background Audio OST Toggle */}
          {isBgAudioPlaying ? (
            <button
              onClick={() => {
                soundFx.playPop();
                pauseBgMusic();
              }}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 text-xs font-medium flex items-center gap-2 transition-all border border-amber-500/20 active:scale-95"
              title="Pause DostFlix background music"
            >
              <VolumeX size={14} />
              <span>Mute OST</span>
            </button>
          ) : (
            <button
              onClick={() => {
                soundFx.playPop();
                resumeBgMusic();
              }}
              className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center gap-2 transition-all border border-white/[0.06] active:scale-95"
              title="Resume DostFlix background music"
            >
              <Volume2 size={14} />
              <span>Resume OST</span>
            </button>
          )}

          {/* Import Spotify Playlist Button */}
          <button
            onClick={() => {
              soundFx.playPop();
              setEditingMood(null);
              setImportUrl('');
              setImportLabel('');
              setImportTitle('');
              setImportSubtitle('');
              setImportMemory('');
              setImportMoodCategory('');
              setImportError('');
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-2 border border-white/10 active:scale-95 transition-all shadow-sm"
          >
            <FolderPlus size={14} className="text-emerald-400" />
            <span>Import Playlist</span>
          </button>

          {/* Add Song Button */}
          <button
            onClick={() => {
              soundFx.playPop();
              setIsAddSongOpen(true);
            }}
            className="px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-white flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
            style={{ backgroundColor: currentTheme.colors.accent }}
          >
            <Plus size={15} />
            <span>Add Song</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-10">

        {/* 1. CURATED & CUSTOM MOOD SELECTOR BAR */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles size={12} style={{ color: currentTheme.colors.accent }} />
              <span>Select Mood Capsule</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsManageModalOpen(true);
                }}
                className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
                title="Modify or delete moods"
              >
                <SlidersHorizontal size={12} />
                <span>Manage Moods</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {moods.map(preset => {
              const Icon = MOOD_ICONS[preset.iconName] || Music;
              const isCurrent = activeDeck?.id === preset.id;

              return (
                <div key={preset.id} className="relative group shrink-0">
                  <button
                    onClick={() => handleLoadTrack(preset)}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all border ${
                      isCurrent
                        ? 'bg-white text-zinc-950 font-bold border-white shadow-md'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 border-white/[0.06]'
                    }`}
                  >
                    <Icon size={14} style={{ color: isCurrent ? '#09090b' : (preset.color || '#3b82f6') }} />
                    <span>{preset.label}</span>
                    {preset.type === 'playlist' && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                        isCurrent ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-zinc-400'
                      }`}>
                        Playlist
                      </span>
                    )}
                  </button>

                  {/* Quick Edit shortcut on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditMood(preset);
                    }}
                    className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-white/20 text-zinc-300 hover:text-white hover:bg-zinc-700 items-center justify-center hidden group-hover:flex shadow transition-all"
                    title={`Edit ${preset.label}`}
                  >
                    <Edit3 size={10} />
                  </button>
                </div>
              );
            })}

            {/* Quick Add / Import Pill */}
            <button
              onClick={() => {
                soundFx.playPop();
                setEditingMood(null);
                setImportUrl('');
                setImportLabel('');
                setImportTitle('');
                setImportSubtitle('');
                setImportMemory('');
                setImportMoodCategory('');
                setImportError('');
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-emerald-400 border border-dashed border-white/20 transition-all"
            >
              <Plus size={13} />
              <span>Import New</span>
            </button>
          </div>
        </div>


        {/* 2. THE HERO LISTENING STAGE (CLEAN, SPOTIFY CENTERPIECE) */}
        <section className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          {/* Top Stage Bar: Now Playing Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06] mb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Now Loaded
                </span>
                <span className="text-[11px] text-zinc-500">•</span>
                <span className="text-[11px] text-zinc-400 font-medium">{activeDeck?.mood || 'Vibe'}</span>
                {activeDeck?.type && (
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold border border-white/10 px-1.5 py-0.2 rounded">
                    {activeDeck.type}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {activeDeck?.title}
              </h2>
              {activeDeck?.subtitle ? (
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{activeDeck.subtitle}</p>
              ) : activeDeck?.artist ? (
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{activeDeck.artist}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle height for playlists / albums */}
              {activeDeck?.type !== 'track' && (
                <button
                  onClick={() => {
                    soundFx.playPop();
                    setIsFullPlayerView(!isFullPlayerView);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium transition-colors bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 rounded-full border border-white/[0.06] active:scale-95"
                >
                  <span>{isFullPlayerView ? 'Fit Compact (152px)' : 'Full View (352px)'}</span>
                </button>
              )}

              {/* Edit Active Mood button */}
              {moods.some(m => m.id === activeDeck?.id) && (
                <button
                  onClick={() => {
                    const target = moods.find(m => m.id === activeDeck?.id);
                    if (target) handleOpenEditMood(target);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium transition-colors bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-full border border-white/[0.06]"
                  title="Modify this mood"
                >
                  <Edit3 size={12} />
                  <span className="hidden sm:inline">Modify</span>
                </button>
              )}

              {activeDeck?.spotifyUrl && (
                <a
                  href={activeDeck.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium transition-colors shrink-0 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 rounded-full border border-white/[0.06]"
                >
                  <span>Open in App</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Spotify Embedded Player (Adaptive height, zero empty voids) */}
          <div 
            className="w-full rounded-2xl overflow-hidden bg-black/60 shadow-inner transition-all duration-300"
            style={{ height: `${playerHeight}px` }}
          >
            {activeDeck?.embedUrl ? (
              <iframe
                key={`${activeDeck.embedUrl}-${playerHeight}`}
                title="Spotify Web Player"
                src={activeDeck.embedUrl}
                width="100%"
                height={playerHeight}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="w-full h-full rounded-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-10">
                <Music size={28} className="mb-2 opacity-40" />
                <p className="text-xs">Select a mood or song to load player</p>
              </div>
            )}
          </div>

          {/* Connected Squad Memory Liner Note */}
          {activeDeck?.memory && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 pt-5 border-t border-white/[0.06] flex items-start gap-3 text-xs sm:text-sm text-zinc-300"
            >
              <Quote size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="italic">"{activeDeck.memory}"</span>
                {activeDeck.sharedBy && (
                  <span className="ml-2 font-semibold text-zinc-400 not-italic">
                    — {activeDeck.sharedBy}
                  </span>
                )}
              </div>
            </motion.div>
          )}

        </section>


        {/* 3. SHARED SQUAD PLAYLIST (EDITORIAL SPOTIFY-STYLE TRACK TABLE) */}
        <section className="pt-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Squad Memory Tracks</span>
                <span className="text-xs font-normal text-zinc-500">({filteredSongs.length})</span>
              </h3>
            </div>

            {/* Dynamic Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
              {dynamicMoodCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    soundFx.playPop();
                    setSelectedMood(cat);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs transition-all shrink-0 ${
                    selectedMood === cat
                      ? 'bg-white/[0.12] text-white font-semibold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Tracklist Rows */}
          <div className="border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04] bg-white/[0.01]">
            {filteredSongs.map((song, idx) => {
              const isLoaded = activeDeck?.embedUrl === song.embedUrl;

              return (
                <div
                  key={song.id}
                  onClick={() => handleLoadTrack(song)}
                  onMouseEnter={() => soundFx.playHover()}
                  className={`px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 transition-all cursor-pointer group ${
                    isLoaded 
                      ? 'bg-white/[0.06]' 
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Left: Number / Play Icon & Track Info */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-5 text-center shrink-0 text-xs font-mono text-zinc-500 group-hover:hidden">
                      {isLoaded ? (
                        <span className="w-2 h-2 rounded-full inline-block bg-emerald-400" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="w-5 text-center shrink-0 hidden group-hover:block">
                      <Play size={14} className="text-white fill-current mx-auto" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold truncate ${isLoaded ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                          {song.title}
                        </span>
                        <span className="text-xs text-zinc-500 truncate hidden sm:inline">
                          • {song.artist}
                        </span>
                      </div>
                      
                      {/* Attached memory line */}
                      <p className="text-xs text-zinc-400 truncate mt-0.5 italic">
                        "{song.memory}"
                      </p>
                    </div>
                  </div>

                  {/* Right: Submitter, Mood, Likes & Remove */}
                  <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-xs">
                    {/* Submitter Badge */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full ${song.avatarColor || 'bg-amber-500'} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {song.sharedBy[0]}
                      </div>
                      <span className="text-zinc-400 text-xs">{song.sharedBy}</span>
                    </div>

                    {/* Mood */}
                    <span className="text-[11px] text-zinc-500 hidden md:inline">
                      {song.mood}
                    </span>

                    {/* Like Count */}
                    <button
                      onClick={(e) => handleLike(song.id, e)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-rose-400 transition-colors py-1 px-1.5"
                      title="Heart this memory"
                    >
                      <Heart size={13} className={song.likes > 0 ? "fill-rose-500 text-rose-500" : ""} />
                      <span className="text-xs">{song.likes}</span>
                    </button>

                    {/* Delete Track */}
                    <button
                      onClick={(e) => handleRemoveSong(song.id, e)}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSongs.length < 5 && (
              <button
                onClick={() => {
                  soundFx.playPop();
                  if (selectedMood !== 'All') setFormMood(selectedMood);
                  setIsAddSongOpen(true);
                }}
                className="w-full px-6 py-3.5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors border-t border-dashed border-white/[0.08]"
              >
                <Plus size={14} />
                <span>Add {selectedMood !== 'All' ? `a "${selectedMood}"` : 'another'} memory song</span>
              </button>
            )}

            {filteredSongs.length === 0 && (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No songs under this mood yet.
              </div>
            )}
          </div>

        </section>

      </div>


      {/* 4. MODAL: IMPORT SPOTIFY PLAYLIST / MODIFY MOOD */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsImportModalOpen(false);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="mb-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <FolderPlus size={14} />
                  <span>{editingMood ? 'Modify Mood Capsule' : 'Spotify Playlist & Mood Importer'}</span>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {editingMood ? `Edit "${editingMood.label}"` : 'Import from Spotify'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Paste any Spotify playlist, album, or track URL to add it as a playable mood station.
                </p>
              </div>

              {importError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {importError}
                </div>
              )}

              <form onSubmit={handleSaveMood} className="space-y-4">
                {/* Spotify URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                      Spotify Link *
                    </label>
                    {isFetchingMeta && (
                      <span className="text-[10px] text-emerald-400 animate-pulse">
                        Auto-fetching details...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={importUrl}
                    onChange={(e) => handleImportUrlChange(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Accepts any playlist, album, or track from open.spotify.com
                  </p>
                </div>

                {/* Mood Capsule Label & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Capsule Button Label *
                    </label>
                    <input
                      type="text"
                      value={importLabel}
                      onChange={(e) => setImportLabel(e.target.value)}
                      placeholder="e.g. Bollywood Butter"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Mood Category
                    </label>
                    <input
                      type="text"
                      value={importMoodCategory}
                      onChange={(e) => setImportMoodCategory(e.target.value)}
                      placeholder="e.g. Bollywood, Chill, Party"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Full Title & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Station Title
                    </label>
                    <input
                      type="text"
                      value={importTitle}
                      onChange={(e) => setImportTitle(e.target.value)}
                      placeholder="e.g. Bollywood Hits 2024"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Subtitle / Description
                    </label>
                    <input
                      type="text"
                      value={importSubtitle}
                      onChange={(e) => setImportSubtitle(e.target.value)}
                      placeholder="e.g. Pure sukoon and roadtrip energy"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Color and Icon Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Vibe Accent Color
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_PALETTE.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            soundFx.playPop();
                            setImportColor(c.value);
                          }}
                          className={`w-6 h-6 rounded-full transition-transform ${importColor === c.value ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Mood Icon
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.keys(MOOD_ICONS).map(iconKey => {
                        const IconCmp = MOOD_ICONS[iconKey];
                        const isSelected = importIcon === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => {
                              soundFx.playPop();
                              setImportIcon(iconKey);
                            }}
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isSelected 
                                ? 'bg-white text-zinc-950 border-white' 
                                : 'bg-white/[0.04] text-zinc-400 hover:text-white border-white/10'
                            }`}
                            title={iconKey}
                          >
                            <IconCmp size={13} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Shared By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Shared By
                    </label>
                    <select
                      value={importSharedBy}
                      onChange={(e) => setImportSharedBy(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none transition-colors"
                    >
                      {PROFILES.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Our Memory Note
                    </label>
                    <input
                      type="text"
                      value={importMemory}
                      onChange={(e) => setImportMemory(e.target.value)}
                      placeholder="e.g. Played on repeat during midnight talks"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: currentTheme.colors.accent }}
                  >
                    <Check size={14} />
                    <span>{editingMood ? 'Save Changes' : 'Import to Lounge'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playPop();
                      setIsImportModalOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* 5. MODAL: MANAGE & DELETE MOODS */}
      <AnimatePresence>
        {isManageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsManageModalOpen(false);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal size={18} />
                  <span>Manage Mood Capsules</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Edit, customize, or delete moods. Central Perk will always stay preserved.
                </p>
              </div>

              {/* Moods List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar my-2 divide-y divide-white/[0.04]">
                {moods.map(moodItem => {
                  const Icon = MOOD_ICONS[moodItem.iconName] || Music;
                  const isCentralPerk = moodItem.id === 'central-perk';

                  return (
                    <div 
                      key={moodItem.id}
                      className="pt-2 pb-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${moodItem.color || '#3b82f6'}20`, color: moodItem.color || '#3b82f6' }}
                        >
                          <Icon size={14} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">
                              {moodItem.label}
                            </span>
                            {isCentralPerk && (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.2 rounded font-medium border border-yellow-500/30">
                                Default Classic
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                              {moodItem.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {moodItem.title}
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setIsManageModalOpen(false);
                            handleOpenEditMood(moodItem);
                          }}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
                          title="Edit this mood"
                        >
                          <Edit3 size={13} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMood(moodItem.id)}
                          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete this mood"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                <button
                  onClick={handleResetDefaultMoods}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-300 transition-colors py-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Reset All to Defaults</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playPop();
                    setIsManageModalOpen(false);
                    setEditingMood(null);
                    setImportUrl('');
                    setImportLabel('');
                    setImportTitle('');
                    setImportSubtitle('');
                    setImportMemory('');
                    setImportMoodCategory('');
                    setImportError('');
                    setIsImportModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl font-semibold text-white flex items-center gap-1.5 shadow"
                  style={{ backgroundColor: currentTheme.colors.accent }}
                >
                  <Plus size={13} />
                  <span>Add New Mood</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* 6. MODAL: ADD TRACK TO MEMORY VAULT */}
      <AnimatePresence>
        {isAddSongOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsAddSongOpen(false);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="mb-5">
                <h3 className="text-lg font-bold text-white">Add Memory Track</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Paste any Spotify song and connect it to a squad memory.</p>
              </div>

              {formError && (
                <div className="p-2.5 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddSong} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Spotify URL *
                  </label>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Yellow"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Artist
                    </label>
                    <input
                      type="text"
                      value={formArtist}
                      onChange={(e) => setFormArtist(e.target.value)}
                      placeholder="e.g. Coldplay"
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Shared By
                    </label>
                    <select
                      value={formSharedBy}
                      onChange={(e) => setFormSharedBy(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none transition-colors"
                    >
                      {PROFILES.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Mood
                    </label>
                    <select
                      value={formMood}
                      onChange={(e) => setFormMood(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white focus:outline-none transition-colors"
                    >
                      {dynamicMoodCategories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Squad Memory / Backstory
                  </label>
                  <textarea
                    rows={2}
                    value={formMemory}
                    onChange={(e) => setFormMemory(e.target.value)}
                    placeholder="e.g. Played this on our drive back from Udaipur..."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-lg hover:brightness-110 active:scale-95 transition-all mt-2"
                  style={{ backgroundColor: currentTheme.colors.accent }}
                >
                  Save Track to Vault
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
