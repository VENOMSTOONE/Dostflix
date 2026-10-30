import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  RotateCcw,
  User,
  Check,
  Shield,
  HardDrive,
  RefreshCw,
  Sparkles,
  Music,
  Camera,
  Heart,
  Bell,
  MapPin,
  Wind,
  Play,
  Shuffle,
  Radio,
  Sliders
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import MemoryVaultManager from '../components/ui/MemoryVaultManager';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import soundFx from '../utils/soundFx';

export default function Developer() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { memories, collections } = useMemories();
  const isFriendsTheme = currentTheme?.id === 'friends';
  const [showVault, setShowVault] = useState(false);
  const [profile, setProfile] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const [savedFavoritesCount, setSavedFavoritesCount] = useState(0);
  const [savedProgressCount, setSavedProgressCount] = useState(0);
  const [savedNotesCount, setSavedNotesCount] = useState(0);

  const [sfxEnabled, setSfxEnabled] = useState(() => soundFx.isEnabled());
  const [sfxVolume, setSfxVolume] = useState(() => soundFx.getVolume());
  const [activeSoundKey, setActiveSoundKey] = useState(null);

  const testSound = (key, soundFunc) => {
    setActiveSoundKey(key);
    soundFunc();
    setTimeout(() => setActiveSoundKey(null), 350);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    soundFx.setEnabled(next);
    setSfxEnabled(next);
    if (next) soundFx.playClick();
    showFeedback(next ? 'Sound FX activated' : 'Sound FX muted');
  };

  const handleVolumeChange = (newVal) => {
    soundFx.setVolume(newVal);
    setSfxVolume(newVal);
  };

  const UI_SOUNDS = [
    {
      id: 'tudum',
      name: 'Cinema Tudum',
      category: 'Playback',
      desc: 'Sub-bass thump + harmonic bloom for full cinema playback',
      icon: Play,
      color: 'from-red-600 to-red-800',
      action: () => soundFx.playTudum()
    },
    {
      id: 'claps',
      name: 'The 4 Claps',
      category: 'Friends Sitcom',
      desc: 'Iconic Central Perk four-clap rhythm stinger',
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-800',
      action: () => soundFx.playClap()
    },
    {
      id: 'shutter',
      name: 'Polaroid Shutter',
      category: 'Keepsakes',
      desc: 'Acoustic mirror flip + physical curtain snap',
      icon: Camera,
      color: 'from-amber-600 to-yellow-800',
      action: () => soundFx.playShutter()
    },
    {
      id: 'favorite',
      name: 'Heart Chime',
      category: 'Engagement',
      desc: 'C6 -> E6 ascending major third resonance',
      icon: Heart,
      color: 'from-rose-600 to-pink-800',
      action: () => soundFx.playFavorite(true)
    },
    {
      id: 'unfavorite',
      name: 'Unfavorite Blip',
      category: 'Engagement',
      desc: 'Subtle descending micro-blip',
      icon: Heart,
      color: 'from-zinc-700 to-zinc-900',
      action: () => soundFx.playFavorite(false)
    },
    {
      id: 'pop',
      name: 'Tactile Pop',
      category: 'Navigation',
      desc: 'Warm resonant bubble pop for cards & modals',
      icon: Sparkles,
      color: 'from-blue-600 to-cyan-800',
      action: () => soundFx.playPop()
    },
    {
      id: 'click',
      name: 'Switch Click',
      category: 'Controls',
      desc: 'Mechanical switch click for toggles & pills',
      icon: Sliders,
      color: 'from-emerald-600 to-teal-800',
      action: () => soundFx.playClick()
    },
    {
      id: 'hover',
      name: 'Silk Micro-Hover',
      category: 'Haptic',
      desc: '50ms throttled high-frequency velvet tick',
      icon: Radio,
      color: 'from-zinc-600 to-zinc-800',
      action: () => soundFx.playHover()
    },
    {
      id: 'swoosh',
      name: 'Carousel Swoosh',
      category: 'Motion',
      desc: 'Filtered airy noise sweep for row scroll',
      icon: Wind,
      color: 'from-violet-600 to-purple-800',
      action: () => soundFx.playSwoosh()
    },
    {
      id: 'pin',
      name: 'Radar Pin Drop',
      category: 'Map',
      desc: 'Acoustic resonant bell tone for map coordinates',
      icon: MapPin,
      color: 'from-teal-600 to-emerald-800',
      action: () => soundFx.playPin()
    },
    {
      id: 'notification',
      name: 'Squad Alert Bell',
      category: 'Activity',
      desc: 'E5 -> B5 dual-tone marimba notification chime',
      icon: Bell,
      color: 'from-orange-600 to-amber-800',
      action: () => soundFx.playNotification()
    },
    {
      id: 'shuffle',
      name: 'Shuffle Cascade',
      category: 'Randomizer',
      desc: '3-tone rising musical arpeggio for shuffles',
      icon: Shuffle,
      color: 'from-sky-600 to-indigo-800',
      action: () => soundFx.playShuffle()
    }
  ];

  const loadStorageStats = () => {
    const savedProf = localStorage.getItem('activeProfile');
    if (savedProf) setProfile(JSON.parse(savedProf));

    const favs = localStorage.getItem('DostFlix_favorites');
    setSavedFavoritesCount(favs ? JSON.parse(favs).length : 0);

    const progressKeys = Object.keys(localStorage).filter(k => k.startsWith('DostFlix_progress_'));
    setSavedProgressCount(progressKeys.length);

    const notesKeys = Object.keys(localStorage).filter(k => k.startsWith('polaroid_note_'));
    setSavedNotesCount(notesKeys.length);
  };

  useEffect(() => {
    loadStorageStats();
  }, []);

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleClearProgress = () => {
    const progressKeys = Object.keys(localStorage).filter(k => k.startsWith('DostFlix_progress_'));
    progressKeys.forEach(k => localStorage.removeItem(k));
    loadStorageStats();
    showFeedback('Playback history cleared');
  };

  const handleClearFavorites = () => {
    localStorage.removeItem('DostFlix_favorites');
    loadStorageStats();
    showFeedback('Bookmarks reset');
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      memories,
      collections,
      favorites: localStorage.getItem('DostFlix_favorites'),
      notes: Object.keys(localStorage)
        .filter(k => k.startsWith('polaroid_note_'))
        .reduce((acc, k) => ({ ...acc, [k]: localStorage.getItem(k) }), {})
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dostflix_archive_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Memory archive downloaded');
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-white px-4 sm:px-8 md:px-12 py-10 md:py-16 select-none relative overflow-x-hidden">
      {/* Ambient Theme Lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-[var(--accent)]/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold tracking-widest uppercase mb-3">
              <Settings size={14} />
              Preferences & System
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {isFriendsTheme ? (
                <span className="font-mono">
                  S<span className="text-[#e50914]">•</span>E<span className="text-[#2563eb]">•</span>T<span className="text-[#eab308]">•</span>T<span className="text-[#e50914]">•</span>I<span className="text-[#2563eb]">•</span>N<span className="text-[#eab308]">•</span>G<span className="text-[#e50914]">•</span>S
                </span>
              ) : (
                "Data Console & Tools"
              )}
            </h1>
            <p className="text-sm text-zinc-400 font-light mt-1">
              Inspect storage stats, backup memory data, and manage client preferences.
            </p>
          </div>

          {feedbackMsg && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-fade-in self-start sm:self-auto">
              <Check size={14} />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Active Profile Card */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${profile?.color || 'bg-red-600'} flex items-center justify-center font-black text-lg text-white shadow-lg`}>
              {profile ? profile.name[0] : 'V'}
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Active Profile</div>
              <h3 className="text-xl font-bold text-white">{profile?.name || 'Vaibhav'}</h3>
              <p className="text-xs text-zinc-400 font-light">Custom preferences mapped to active profile ID</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-white/5 transition-all self-start sm:self-auto"
          >
            Switch Profile
          </button>
        </div>

        {/* Diagnostics & Storage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LocalStorage Data Manager */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 text-zinc-300 font-bold mb-1">
                <Database size={18} className="text-[var(--accent)]" />
                <span>Client Storage Status</span>
              </div>
              <p className="text-xs text-zinc-400 font-light mb-4">
                Local browser storage tracking bookmarks, progress, and handwritten notes.
              </p>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-400">Favorited Stories:</span>
                  <span className="font-bold text-white">{savedFavoritesCount} items</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-400">Continue Watching Entries:</span>
                  <span className="font-bold text-white">{savedProgressCount} items</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-400">Handwritten Polaroid Notes:</span>
                  <span className="font-bold text-white">{savedNotesCount} notes</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <button
                onClick={handleClearProgress}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-white/5 transition-all"
              >
                Clear Progress
              </button>
              <button
                onClick={handleClearFavorites}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-white/5 transition-all"
              >
                Reset Favorites
              </button>
            </div>
          </div>

          {/* Backup & System Tools */}
          <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 text-zinc-300 font-bold mb-1">
                <HardDrive size={18} className="text-[var(--accent)]" />
                <span>Backup & Vault</span>
              </div>
              <p className="text-xs text-zinc-400 font-light mb-4">
                Export an offline JSON snapshot of the memories catalog and saved notes.
              </p>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-400">Curated Memories:</span>
                  <span className="font-bold text-white">{memories.length} entries</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-400">Collections:</span>
                  <span className="font-bold text-white">{collections.length} categories</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5">
                  <span className="text-zinc-400">Audio Track:</span>
                  <span className="font-bold text-emerald-400">
                    {isFriendsTheme ? 'Friends Theme Song.mp3' : 'background.mp3'} (Ready)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <button
                onClick={handleExportBackup}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--accent)] hover:brightness-110 text-white text-xs font-bold shadow-[0_0_15px_var(--accent-glow)] transition-all active:scale-95"
              >
                <Download size={14} />
                <span>Export Backup</span>
              </button>
              <button
                onClick={() => setShowVault(true)}
                className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-white/5 transition-all"
              >
                Open Vault
              </button>
            </div>
          </div>

        </div>

        {/* Interactive Haptic UI Sound Studio & Audio Tester */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          {/* Ambient Studio Lighting Accent */}
          <div className="absolute top-0 right-10 w-72 h-72 bg-[var(--accent)]/15 rounded-full blur-[100px] pointer-events-none -z-10" />

          {/* Studio Header & Live Volume / Mute Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold tracking-widest uppercase mb-2">
                <Volume2 size={13} />
                <span>Web Audio Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Haptic UI Sound Studio</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  0ms Latency
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1 max-w-xl">
                Synthesized live via the Web Audio API with zero external audio assets. Test every interactive chime, stinger, and tactile feedback tone across DostFlix.
              </p>
            </div>

            {/* Live Master Controls Deck */}
            <div className="flex items-center gap-4 bg-zinc-950/80 border border-white/10 p-3 rounded-2xl self-start md:self-auto shadow-inner">
              {/* Sound Enable / Mute Switch */}
              <button
                onClick={handleToggleSfx}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sfxEnabled
                    ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-glow)]'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title={sfxEnabled ? "Mute UI sounds" : "Enable UI sounds"}
              >
                {sfxEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>{sfxEnabled ? 'FX Enabled' : 'FX Muted'}</span>
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <span className="text-[11px] text-zinc-400 font-mono w-9 text-right">
                  {Math.round(sfxVolume * 100)}%
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxEnabled ? sfxVolume : 0}
                  disabled={!sfxEnabled}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 sm:w-28 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)] disabled:opacity-40"
                  style={{
                    background: `linear-gradient(to right, var(--accent) ${(sfxEnabled ? sfxVolume : 0) * 100}%, #27272a ${(sfxEnabled ? sfxVolume : 0) * 100}%)`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sound Triggers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {UI_SOUNDS.map(sound => {
              const Icon = sound.icon;
              const isActive = activeSoundKey === sound.id;

              return (
                <div
                  key={sound.id}
                  onClick={() => testSound(sound.id, sound.action)}
                  onMouseEnter={() => soundFx.playHover()}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden select-none ${
                    isActive
                      ? 'bg-zinc-800 border-[var(--accent)] scale-[0.98] shadow-[0_0_20px_var(--accent-glow)]'
                      : 'bg-zinc-950/60 hover:bg-zinc-800/80 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sound.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                          {sound.name}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {sound.category}
                        </span>
                      </div>
                    </div>

                    <button
                      className="px-2 py-0.5 rounded-lg bg-white/5 group-hover:bg-[var(--accent)] text-zinc-400 group-hover:text-white text-[10px] font-bold transition-colors"
                    >
                      Test
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-light leading-snug">
                    {sound.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {showVault && <MemoryVaultManager onClose={() => setShowVault(false)} />}
      </div>
    </div>
  );
}
