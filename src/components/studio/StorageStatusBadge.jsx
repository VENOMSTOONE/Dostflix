import React, { useState, useEffect } from 'react';
import { Database, Cloud, HardDrive, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { isSupabaseConfigured, checkSupabaseConnection } from '../../services/supabaseStorage';

export default function StorageStatusBadge({ totalMediaCount = 0 }) {
  const [cloudStatus, setCloudStatus] = useState({ connected: false, checked: false });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function testCloud() {
      if (isSupabaseConfigured) {
        const res = await checkSupabaseConnection();
        setCloudStatus({ connected: res.connected, checked: true });
      } else {
        setCloudStatus({ connected: false, checked: true });
      }
    }
    testCloud();
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2">
      <div 
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all cursor-pointer text-xs select-none backdrop-blur-md"
      >
        {/* IndexedDB Permanent Local Storage Indicator */}
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <HardDrive size={13} />
          <span>Local Vault ({totalMediaCount} files)</span>
        </span>

        <span className="text-zinc-600">•</span>

        {/* Cloud Sync Status */}
        {cloudStatus.connected ? (
          <span className="flex items-center gap-1 text-cyan-400 font-medium">
            <Cloud size={13} />
            <span>Supabase Synced</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-400 font-normal">
            <Database size={13} />
            <span>IndexedDB Persistent</span>
          </span>
        )}

        <Info size={12} className="text-zinc-500 hover:text-zinc-300 ml-0.5" />
      </div>

      {/* Storage Information Popup */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 z-50 w-72 p-3.5 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl text-xs text-zinc-300 backdrop-blur-xl">
          <div className="flex items-center gap-2 font-semibold text-white mb-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Permanent Storage Active</span>
          </div>
          <p className="text-zinc-400 leading-relaxed mb-2">
            Your photos and videos are stored in high-capacity browser <strong>IndexedDB</strong>. They persist permanently on this device across reboots, tab closures, and page refreshes.
          </p>
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Storage Engine:</span>
            <span className="font-mono text-zinc-300">DostFlixStudioDB (v1)</span>
          </div>
        </div>
      )}
    </div>
  );
}
