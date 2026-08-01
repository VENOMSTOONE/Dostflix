import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-surface/50 border-t border-primary/10 py-12 mt-20">
      <div className="w-full px-6 md:px-12 text-center text-primary/50 text-sm">
        <p>&copy; {new Date().getFullYear()} DostFlix Memory Streaming.</p>
        <p className="mt-2 tracking-wide font-light">Crafted for personal preservation.</p>
      </div>
    </footer>
  );
}
