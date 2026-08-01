import React from 'react';
import { memories, collections } from '../data/memories';
import { BarChart3, Image as ImageIcon, Video, CalendarDays, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-surface/50 border border-white/5 p-6 rounded-2xl flex items-center gap-6"
  >
    <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-500`}>
      <Icon size={32} />
    </div>
    <div>
      <div className="text-sm text-primary/50 font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  </motion.div>
);

export default function Stats() {
  const totalMemories = memories.length;
  const totalPhotos = memories.filter(m => m.assets.some(a => a.endsWith('.jpeg'))).length;
  const totalVideos = memories.filter(m => m.assets.some(a => a.endsWith('.mp4'))).length;

  return (
    <div className="bg-background min-h-screen text-white px-6 md:px-12 py-12 md:py-20 select-none">
      <h1 className="text-4xl font-extrabold tracking-tight mb-12 border-l-4 border-accent pl-6">Memory Archive Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        <StatCard icon={BarChart3} label="Total Memories" value={totalMemories} color="bg-blue-500" />
        <StatCard icon={ImageIcon} label="Photo Galleries" value={totalPhotos} color="bg-emerald-500" />
        <StatCard icon={Video} label="Video Stories" value={totalVideos} color="bg-rose-500" />
      </div>
    </div>
  );
}
