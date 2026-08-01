import React from 'react';
import { Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeveloperBanner({ onDismiss }) {
  const navigate = useNavigate();

  return (
    <div className="fixed top-20 left-0 w-full z-[1000] bg-amber-500 text-black px-6 py-2 flex items-center justify-between font-bold text-xs uppercase tracking-widest shadow-xl">
      <span className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => navigate('/developer')}>
        <Terminal size={14} /> Developer Mode Unlocked: Click here to enter console
      </span>
      <button onClick={onDismiss} className="hover:text-white">Dismiss</button>
    </div>
  );
}
