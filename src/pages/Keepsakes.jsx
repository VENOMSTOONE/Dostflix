import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const POLAROID_IMAGES = [
  { file: 'WhatsApp Image 2026-07-30 at 6.42.12 PM.jpeg', title: 'Retro Photo Booth Loops' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.13 PM.jpeg', title: 'Postcards from Udaipur' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.14 PM.jpeg', title: 'Food, Menus & Deep Chats' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.14 PM (1).jpeg', title: 'Virtual Projects' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.15 PM.jpeg', title: 'Video Call Night' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.15 PM (1).jpeg', title: 'Video Call Night' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.16 PM.jpeg', title: 'Sweet Escapes' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.17 PM.jpeg', title: 'Sweet Escapes' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.18 PM.jpeg', title: 'Video Call Night' },
  { file: 'WhatsApp Image 2026-07-30 at 6.42.19 PM.jpeg', title: 'Food, Menus & Deep Chats' },
];

export default function Keepsakes() {
  const containerRef = useRef(null);
  const [selectedDeck, setSelectedDeck] = useState([]);
  const [cardWidth, setCardWidth] = useState(140);

  useEffect(() => {
    const shuffled = [...POLAROID_IMAGES].sort(() => 0.5 - Math.random());
    setSelectedDeck(shuffled.slice(0, 6));

    const handleResize = () => setCardWidth(window.innerWidth < 640 ? 110 : 160);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#5c4033] min-h-screen p-6 md:p-12 overflow-hidden relative" ref={containerRef}>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')]" />

      <h1 className="text-4xl font-black text-white mb-2 relative z-10 text-center uppercase tracking-widest">Keepsake Box</h1>
      <p className="text-white/60 text-center mb-16 relative z-10 font-serif italic">Arranged for the feels</p>

      {/* Centered Area for Polaroids */}
      <div className="w-full h-[60vh] mt-64 flex items-center justify-center relative">
        {selectedDeck.map((item, index) => (
          <motion.div
            key={item.file}
            drag
            dragConstraints={containerRef}
            initial={{
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() * 80) + 130, // Force spawn below center by at least 130px
              rotate: Math.random() * 40 - 20,
            }}
            whileDrag={{ scale: 1.1, zIndex: 100, rotate: 0 }}
            style={{
              width: `${cardWidth}px`,
              padding: `${cardWidth * 0.08}px`,
              paddingBottom: `${cardWidth * 0.26}px`,
            }}
            className="absolute bg-white shadow-2xl cursor-grab active:cursor-grabbing border border-zinc-200/50 rounded flex flex-col items-center"
          >
            <div className="w-full aspect-square bg-zinc-100 overflow-hidden relative shadow-inner">
              <img
                src={`/Polaroids/${item.file}`}
                alt={item.title}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
