import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, Database } from 'lucide-react';
import { memories } from '../data/memories';
import MemoryVaultManager from '../components/ui/MemoryVaultManager';

export default function Developer() {
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [showVault, setShowVault] = useState(false);

  useEffect(() => {
    const rawLogs = [
      'Initializing DostFlix Developer Portal...',
      'Auth Bypass: APPROVED [Konami Code Override]',
      'Scanning local media registry in /public...',
      `Found ${memories.length} grouped memories.`,
      `Syncing 10 assets (JPEGs) & 10 assets (MP4s)...`,
      'Memory cache status: 100% hits',
      'System temperature: NORMAL (32°C)',
      'Render pipeline status: ACTIVE (Vite Dev HMR ready)',
      'Secure connection: ENCRYPTED',
      'Terminal access granted. Welcome, Developer.'
    ];

    rawLogs.forEach((log, index) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, log]);
      }, (index + 1) * 350);
    });
  }, []);

  return (
    <div className="bg-[#050505] min-h-screen text-emerald-400 font-mono px-6 md:px-12 py-12 md:py-20 select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Portal Header */}
        <div className="flex items-center gap-4 border-b border-emerald-900 pb-6">
          <Terminal size={36} className="text-emerald-500" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">Developer Mode</h1>
            <p className="text-xs text-emerald-600">
              Secure Administrative Console //{' '}
              <span className="cursor-text" onClick={() => setShowVault(true)}>
                Build version 0.1.0
              </span>
            </p>
          </div>
        </div>

        {/* Terminal logs panel */}
        <div className="bg-black/80 rounded-xl border border-emerald-900/60 p-5 h-64 overflow-y-auto flex flex-col gap-1.5 shadow-2xl">
          {terminalLogs.map((log, i) => (
            <div key={i} className="text-sm">
              <span className="text-emerald-700 select-none">dostflix:/sys$</span> {log}
            </div>
          ))}
          <div className="w-2.5 h-4 bg-emerald-400 animate-pulse mt-1 inline-block" />
        </div>

        {/* Diagnostic modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">

          <div className="bg-zinc-950/80 border border-emerald-900/50 p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-emerald-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Database size={16} /> Cache Diagnostic Registry
            </h3>
            <div className="flex flex-col gap-2 text-xs text-emerald-600">
              <div className="flex justify-between"><span>RAM Allocated:</span> <span className="text-white">128 MB</span></div>
              <div className="flex justify-between"><span>Vite Hot-Reload Pins:</span> <span className="text-white">OK</span></div>
              <div className="flex justify-between"><span>Diagnostic Coverage:</span> <span className="text-white">100%</span></div>
              <div className="flex justify-between"><span>Unused WhatsApp Assets:</span> <span className="text-white">0</span></div>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-emerald-900/50 p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-emerald-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} /> System Integrity
            </h3>
            <div className="flex flex-col gap-2 text-xs text-emerald-600">
              <div className="flex justify-between"><span>Filesystem Read/Write:</span> <span className="text-white">Locked</span></div>
              <div className="flex justify-between"><span>Konami Bypass Hook:</span> <span className="text-white">Active</span></div>
              <div className="flex justify-between"><span>Network Traffic:</span> <span className="text-pure">n/a</span></div>
              <div className="flex justify-between"><span>Status:</span> <span className="text-emerald-400 font-bold animate-pulse">SECURE</span></div>
            </div>
          </div>

        </div>

        {showVault && <MemoryVaultManager onClose={() => setShowVault(false)} />}
      </div>
    </div>
  );
}
