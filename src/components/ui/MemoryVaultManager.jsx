import React, { useState } from 'react';
import { Upload, Trash, X } from 'lucide-react';

export default function MemoryVaultManager({ onClose }) {
  const [memories, setMemories] = useState(JSON.parse(localStorage.getItem('DostFlix_vault') || '[]'));
  const [newTitle, setNewTitle] = useState('');

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newMemory = {
        id: Date.now().toString(),
        title: newTitle || 'Untitled Memory',
        thumbnail: event.target.result,
        assets: [event.target.result],
        date: new Date().toISOString(),
        location: 'Local Upload',
        mood: 'happy',
        tags: ['uploaded'],
        collectionId: 'coll-dates'
      };
      const updated = [...memories, newMemory];
      setMemories(updated);
      localStorage.setItem('DostFlix_vault', JSON.stringify(updated));
      setNewTitle('');
    };
    reader.readAsDataURL(file);
  };

  const deleteMemory = (id) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem('DostFlix_vault', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-surface border border-white/10 w-full max-w-3xl rounded-2xl p-8 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Memory Vault Manager</h1>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="bg-background border border-white/5 p-4 rounded-xl mb-8 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Memory Title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg px-4 py-2 flex-grow focus:outline-none focus:border-accent"
          />
          <label className="bg-accent text-black font-bold px-6 py-2 rounded-lg cursor-pointer hover:bg-white transition-colors flex items-center gap-2">
            <Upload size={18} /> Upload
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {memories.map(m => (
            <div key={m.id} className="relative bg-black rounded-lg overflow-hidden border border-white/5">
              <img src={m.thumbnail} className="w-full h-32 object-cover" alt="" />
              <div className="p-3">
                <h4 className="font-bold text-xs truncate text-white">{m.title}</h4>
                <button
                  onClick={() => deleteMemory(m.id)}
                  className="mt-2 text-rose-500 text-[10px] flex items-center gap-1 hover:text-rose-400"
                >
                  <Trash size={10} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
