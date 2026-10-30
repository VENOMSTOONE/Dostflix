import React from 'react';
import { memories, collections } from '../data/memories';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3,
  Image as ImageIcon,
  Video,
  MapPin,
  Calendar,
  Users,
  Smile,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const FRIENDS = [
  { name: 'Vaibhav', color: 'bg-emerald-500', barColor: 'bg-emerald-500', text: 'text-emerald-400' },
  { name: 'Stuti', color: 'bg-rose-500', barColor: 'bg-rose-500', text: 'text-rose-400' },
  { name: 'Lakshay', color: 'bg-blue-500', barColor: 'bg-blue-500', text: 'text-blue-400' }
];

export default function Stats() {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const isFriendsTheme = currentTheme?.id === 'friends';

  const totalMemories = memories.length;
  const totalPhotos = memories.reduce((acc, m) => acc + m.assets.filter(a => a.endsWith('.jpeg')).length, 0);
  const totalVideos = memories.reduce((acc, m) => acc + m.assets.filter(a => a.endsWith('.mp4')).length, 0);

  // Group locations
  const locationMap = memories.reduce((acc, m) => {
    acc[m.location] = (acc[m.location] || 0) + 1;
    return acc;
  }, {});

  const locationsList = Object.entries(locationMap).map(([loc, count]) => ({
    name: loc,
    count
  })).sort((a, b) => b.count - a.count);

  // Group by month
  const monthlyMap = memories.reduce((acc, m) => {
    const month = new Date(m.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthsList = Object.entries(monthlyMap);
  const maxMonthCount = Math.max(...monthsList.map(([_, c]) => c), 1);

  // Moods count
  const moodMap = memories.reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-[#09090b] min-h-screen text-white px-4 sm:px-8 md:px-12 py-10 md:py-16 select-none relative overflow-x-hidden">
      {/* Ambient Theme Lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-[var(--accent)]/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[300px] bg-sky-600/5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold tracking-widest uppercase mb-3">
            <TrendingUp size={14} />
            Activity & Insights
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            {isFriendsTheme ? (
              <span className="font-black tracking-wider">
                I<span className="text-[#e50914] mx-0.5">•</span>N<span className="text-[#2563eb] mx-0.5">•</span>S<span className="text-[#eab308] mx-0.5">•</span>I<span className="text-[#e50914] mx-0.5">•</span>G<span className="text-[#2563eb] mx-0.5">•</span>H<span className="text-[#eab308] mx-0.5">•</span>T<span className="text-[#e50914] mx-0.5">•</span>S
              </span>
            ) : (
              "Squad Insights & Metrics"
            )}
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-light mt-1 max-w-xl leading-relaxed">
            Data insights, friend participation, and location footprints across all recorded memories.
          </p>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-white/10 hover:border-white/20 transition-all self-start md:self-auto"
        >
          <span>Explore Home</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-10">

        {/* Top 4 Key Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-zinc-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-[var(--accent)]/40 transition-all"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider">Stories</span>
              <div className="p-2.5 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                <BarChart3 size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-[var(--accent)] transition-colors">
                {totalMemories}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Curated friendship chapters</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-zinc-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-sky-500/30 transition-all"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider">Videos & Clips</span>
              <div className="p-2.5 rounded-xl bg-sky-600/10 text-sky-400">
                <Video size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-sky-400 transition-colors">
                {totalVideos}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Short clips & video stories</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-zinc-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider">Photos</span>
              <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-400">
                <ImageIcon size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-emerald-400 transition-colors">
                {totalPhotos}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Polaroids & gallery assets</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-zinc-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider">Hangouts</span>
              <div className="p-2.5 rounded-xl bg-amber-600/10 text-amber-400">
                <MapPin size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-white group-hover:text-amber-400 transition-colors">
                {locationsList.length}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Unique visited spaces</p>
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Squad Participation + Monthly Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Squad Member Participation (Col 6) */}
          <div className="lg:col-span-6 bg-zinc-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-[var(--accent)]" />
                  Squad Presence
                </h3>
                <span className="text-xs text-zinc-500 font-medium">3 Squad Members</span>
              </div>
              <p className="text-xs text-zinc-400 font-light mb-6">
                Frequency of appearances in stories and photo collections.
              </p>

              <div className="flex flex-col gap-5">
                {FRIENDS.map(friend => {
                  const count = memories.filter(m => m.people?.includes(friend.name)).length;
                  const percentage = Math.round((count / totalMemories) * 100);

                  return (
                    <div key={friend.name} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5 font-bold text-zinc-200">
                          <span className={`w-3 h-3 rounded-full ${friend.color}`} />
                          <span>{friend.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white">{count}</span>
                          <span className="text-zinc-500">({percentage}%)</span>
                        </div>
                      </div>

                      {/* Meter Track */}
                      <div className="w-full h-2.5 rounded-full bg-zinc-800/80 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${friend.barColor}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
              <span>All 3 friends tagged across multiple experiences</span>
              <button
                onClick={() => navigate('/timeline')}
                className="text-[var(--accent)] hover:brightness-110 font-semibold flex items-center gap-1"
              >
                <span>Timeline</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Monthly Memory Distribution (Col 6) */}
          <div className="lg:col-span-6 bg-zinc-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-[var(--accent)]" />
                  Monthly Timeline Distribution
                </h3>
                <span className="text-xs text-zinc-500 font-medium">Summer 2026</span>
              </div>
              <p className="text-xs text-zinc-400 font-light mb-6">
                Chronological volume of stories captured per month.
              </p>

              {/* Bar Chart Visualization */}
              <div className="flex items-end justify-around h-44 pt-6 pb-2 border-b border-white/10">
                {monthsList.map(([month, count]) => {
                  const barHeight = Math.round((count / maxMonthCount) * 100);

                  return (
                    <div key={month} className="flex flex-col items-center gap-3 w-16 group">
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-[var(--accent)] transition-colors">
                        {count}
                      </span>
                      <div className="w-10 bg-zinc-800 rounded-t-xl overflow-hidden h-28 flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="w-full bg-gradient-to-t from-[var(--accent)] to-[var(--accent-hover)] rounded-t-xl group-hover:brightness-110 transition-all shadow-[0_0_12px_var(--accent-glow)]"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                        {month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
              <span>Peak memory capture: <strong className="text-white">July 2026 (3 stories)</strong></span>
              <button
                onClick={() => navigate('/search')}
                className="text-[var(--accent)] hover:brightness-110 font-semibold flex items-center gap-1"
              >
                <span>Search archive</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Section: Top Locations Leaderboard + Mood Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Locations Leaderboard (Col 7) */}
          <div className="lg:col-span-7 bg-zinc-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin size={18} className="text-[var(--accent)]" />
                Hangout Locations
              </h3>
              <button
                onClick={() => navigate('/map')}
                className="text-xs text-[var(--accent)] hover:brightness-110 font-semibold flex items-center gap-1"
              >
                <span>Interactive Map</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {locationsList.map(loc => (
                <div
                  key={loc.name}
                  onClick={() => navigate('/map')}
                  className="p-3.5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-white/5 hover:border-[var(--accent)]/30 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-zinc-900 group-hover:bg-[var(--accent)]/15 group-hover:text-[var(--accent)] transition-colors text-zinc-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                        {loc.name}
                      </h4>
                      <span className="text-[11px] text-zinc-500 font-light">
                        {loc.count === 1 ? '1 memory' : `${loc.count} memories`}
                      </span>
                    </div>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-zinc-900 border border-white/5 text-[11px] font-bold text-zinc-400 flex items-center justify-center group-hover:border-white/20">
                    {loc.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vibes & Moods (Col 5) */}
          <div className="lg:col-span-5 bg-zinc-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Smile size={18} className="text-[var(--accent)]" />
                Vibe Distribution
              </h3>
              <p className="text-xs text-zinc-400 font-light mb-6">
                Dominant mood tags assigned to squad memories.
              </p>

              <div className="flex flex-col gap-3">
                {Object.entries(moodMap).map(([mood, count]) => {
                  const pct = Math.round((count / totalMemories) * 100);
                  return (
                    <div
                      key={mood}
                      className="p-3 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                        <span className="text-sm font-semibold capitalize text-zinc-200">{mood}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white">{count} stories</span>
                        <span className="text-zinc-500">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-zinc-500 font-light">
              High-energy banter and happy hangouts comprise 80%+ of DostFlix stories.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
