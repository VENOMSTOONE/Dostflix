import React from 'react';
import { memories } from '../data/memories';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Timeline() {
  const navigate = useNavigate();

  // Sort memories oldest to newest
  const sortedMemories = [...memories].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="bg-background min-h-screen text-white px-6 md:px-12 py-12 md:py-20 select-none overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight mb-16 text-center">
          Chronicles of Us
        </h1>

        <div className="relative">
          {/* Vertical Tracking Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-accent to-transparent transform md:-translate-x-1/2" />

          <div className="flex flex-col gap-12">
            {sortedMemories.map((memory, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className={`relative flex items-center justify-between w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[16px] md:left-1/2 w-3 h-3 bg-accent rounded-full transform -translate-x-1/2 shadow-[0_0_10px_#e50914] z-10" />

                  {/* Empty space for alternating layout */}
                  <div className="hidden md:block w-[45%]" />

                  {/* Content Card */}
                  <div
                    className="w-[calc(100%-50px)] ml-[50px] md:ml-0 md:w-[45%] bg-surface/50 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:bg-surface transition-colors shadow-xl group"
                    onClick={() => navigate(`/memory/${memory.id}`)}
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={memory.thumbnail}
                        className="w-full h-full object-cover brightness-[0.7] group-hover:brightness-[0.9] group-hover:scale-105 transition-all duration-700"
                        alt={memory.title}
                      />
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 text-xs font-semibold text-white/90">
                        <Calendar size={14} className="text-accent" />
                        {new Date(memory.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col gap-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-accent transition-colors">{memory.title}</h3>
                      <p className="text-sm text-primary/60 line-clamp-2 leading-relaxed">{memory.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
