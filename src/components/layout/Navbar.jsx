import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedProfile = localStorage.getItem('activeProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/90 backdrop-blur-md shadow-lg py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="w-full px-6 md:px-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-red-600 cursor-pointer" onClick={() => navigate('/home')}>DostFlix</h1>
            <div className="hidden md:flex gap-6 text-sm font-medium text-primary/80">
              <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/home')}>Home</span>
              <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/timeline')}>Timeline</span>
              <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/keepsakes')}>Keepsakes</span>
              <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/map')}>Map</span>
              <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/search')}>Search</span>
              <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/stats')}>Stats</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-primary/80">
            <button className="hover:text-primary transition-colors" onClick={() => navigate('/search')}><Search size={20} /></button>

            {/* Notifications */}
            <div className="relative">
              <button className="hover:text-primary transition-colors" onClick={() => setShowNotifications(!showNotifications)}><Bell size={20} /></button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-64 bg-surface border border-white/10 rounded-lg p-4 shadow-xl z-50">
                  <h4 className="text-xs font-bold text-accent uppercase mb-2">Notifications</h4>
                  <p className="text-sm text-primary/70">No new memories shared recently.</p>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <div
                className={`h-8 w-8 rounded-full border border-primary/20 flex items-center justify-center hover:border-accent transition-colors cursor-pointer overflow-hidden ${profile?.color || 'bg-surface'}`}
                onClick={() => setShowProfile(!showProfile)}
              >
                {profile ? (
                  <span className="text-white text-sm font-black uppercase">{profile.name[0]}</span>
                ) : (
                  <img
                    src="/profile.png"
                    onError={(e) => { e.target.onerror = null; e.target.src = "/WhatsApp Image 2026-07-30 at 6.42.18 PM.jpeg"; }}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {showProfile && (
                <div className="absolute right-0 top-10 w-48 bg-surface border border-white/10 rounded-lg p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-white/5 mb-1 font-bold text-xs truncate text-primary/60">
                    Watching as {profile?.name || 'Guest'}
                  </div>
                  <button className="w-full p-2 text-left text-sm hover:bg-white/5 rounded">My Account</button>
                  <button className="w-full p-2 text-left text-sm hover:bg-white/5 rounded">Help Center</button>
                  <button onClick={() => navigate('/')} className="w-full p-2 text-left text-sm text-red-500 hover:bg-red-500/10 rounded mt-1 border-t border-white/5">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
