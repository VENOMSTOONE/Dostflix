import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, User, Compass, Calendar, Camera, MapPin, Home as HomeIcon, BarChart2, Palette, Check, Sparkles, Tv, Disc3, Film, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ThemeSelectorModal from '../ui/ThemeSelectorModal';
import soundFx from '../../utils/soundFx';

const NAV_LINKS = [
  { label: 'Home', path: '/home', icon: HomeIcon },
  { label: 'Timeline', path: '/timeline', icon: Calendar },
  { label: 'Keepsakes', path: '/keepsakes', icon: Camera },
  { label: 'Jukebox', path: '/jukebox', icon: Disc3 },
  { label: 'Studio', path: '/studio', icon: Film },
  { label: 'Places', path: '/map', icon: MapPin },
  { label: 'Search', path: '/search', icon: Search },
  { label: 'Insights', path: '/stats', icon: BarChart2 },
];

const NOTIFICATIONS = [
  {
    id: 'notif-1',
    actor: 'Stuti',
    color: 'bg-rose-500',
    action: 'pinned scoops from Naturals in',
    target: 'Ice Cream Hangout',
    time: '2 hours ago',
    unread: true
  },
  {
    id: 'notif-2',
    actor: 'Lakshay',
    color: 'bg-blue-500',
    action: 'added postcards in',
    target: 'Postcards from Udaipur',
    time: 'Yesterday',
    unread: true
  },
  {
    id: 'notif-3',
    actor: 'Vaibhav',
    color: 'bg-emerald-500',
    action: 'rewatched the story of',
    target: 'Retro Photo Booth Chaos',
    time: '3 days ago',
    unread: false
  }
];

export default function Navbar({ onOpenLounge }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(2);

  const { currentTheme } = useTheme();
  const { lockDostflix } = useAuth();
  const isFriendsTheme = currentTheme?.id === 'friends';
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('activeProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <>
      {/* Top Desktop & Tablet Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#09090b]/90 backdrop-blur-xl border-b border-white/5 py-3.5 shadow-2xl'
            : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent py-5'
        }`}
      >
        <div className="w-full px-4 sm:px-8 md:px-12">
          <div className="flex justify-between items-center">

            {/* Left: Brand + Nav Links */}
            <div className="flex items-center gap-8 lg:gap-10">
              <div
                onClick={() => navigate('/home')}
                className="flex items-center gap-1 cursor-pointer group select-none"
              >
                {/* Dynamic Logo: F·R·I·E·N·D·S colored dots when in Sitcom theme! */}
                {currentTheme.id === 'friends' ? (
                  <div className="flex items-center text-xl sm:text-2xl md:text-3xl font-black tracking-widest text-white group-hover:scale-105 transition-transform">
                    <span>D</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-0.5 sm:mx-1" />
                    <span>O</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-0.5 sm:mx-1" />
                    <span>S</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mx-0.5 sm:mx-1" />
                    <span>T</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-0.5 sm:mx-1" />
                    <span>F</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mx-0.5 sm:mx-1" />
                    <span>L</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mx-0.5 sm:mx-1" />
                    <span>I</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mx-0.5 sm:mx-1" />
                    <span>X</span>
                  </div>
                ) : (
                  <h1
                    className="text-2xl md:text-3xl font-black tracking-tighter transition-colors"
                    style={{ color: currentTheme.colors.accent }}
                  >
                    DostFlix
                  </h1>
                )}
              </div>

              {/* Desktop Nav Items */}
              <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm">
                {NAV_LINKS.map(link => {
                  const isActive = location.pathname === link.path;
                  return (
                    <button
                      key={link.path}
                      onMouseEnter={() => soundFx.playHover()}
                      onClick={() => {
                        soundFx.playPop();
                        navigate(link.path);
                      }}
                      className={`relative py-1 transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-zinc-400 hover:text-zinc-200 font-normal'
                      }`}
                    >
                      <span>{link.label}</span>
                      {isActive && (
                        <span
                          className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full"
                          style={{
                            backgroundColor: currentTheme.colors.accent,
                            boxShadow: `0 0 8px ${currentTheme.colors.accent}`
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Search, Theme, Notifications, Profile */}
            <div className="flex items-center gap-3 sm:gap-5 text-zinc-300">
              {/* Search Icon button */}
              <button
                onClick={() => {
                  soundFx.playClick();
                  navigate('/search');
                }}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Search"
              >
                <Search size={18} />
              </button>

              {/* Lounge Ambient Mode Button */}
              {onOpenLounge && (
                <button
                  onClick={() => {
                    soundFx.playPop();
                    onOpenLounge();
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
                  title="Ambient Lounge Screensaver"
                >
                  <Tv size={17} />
                  <span className="hidden xl:inline text-xs font-semibold text-zinc-300">Lounge</span>
                </button>
              )}

              {/* Theme Switcher Button */}
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsThemeModalOpen(true);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors relative"
                title="Change Theme"
              >
                <Palette size={18} />
                <span
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full ring-2 ring-[#09090b]"
                  style={{ backgroundColor: currentTheme.colors.accent }}
                />
              </button>

              {/* Lock Dostflix (The Inner Circle) */}
              <button
                onClick={() => {
                  soundFx.playPop();
                  lockDostflix();
                }}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-amber-400 transition-colors"
                title="Lock Dostflix (The Inner Circle)"
              >
                <Lock size={17} />
              </button>

              {/* Notifications Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    soundFx.playNotification();
                    setShowNotifications(!showNotifications);
                    if (unreadCount > 0) setUnreadCount(0);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors relative"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ring-2 ring-[#09090b]"
                      style={{ backgroundColor: currentTheme.colors.accent }}
                    />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 sm:w-88 bg-zinc-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">Squad Activity</span>
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            backgroundColor: `${currentTheme.colors.accent}20`,
                            color: currentTheme.colors.accent
                          }}
                        >
                          Live
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">Recent</span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                      {NOTIFICATIONS.map(n => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/60 border border-white/5 transition-all flex items-start gap-3 cursor-pointer"
                          onClick={() => {
                            soundFx.playPop();
                            setShowNotifications(false);
                            navigate('/home');
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                          <div className="flex-1 text-xs text-zinc-300 leading-relaxed">
                            <span className="font-bold text-white mr-1">{n.actor}</span>
                            {n.action} <span className="font-semibold" style={{ color: currentTheme.colors.accent }}>"{n.target}"</span>
                            <div className="text-[10px] text-zinc-500 mt-1 font-light">{n.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar & Menu */}
              <div className="relative" ref={profileRef}>
                <div
                  onClick={() => {
                    soundFx.playClick();
                    setShowProfile(!showProfile);
                  }}
                  className={`h-8 w-8 rounded-full border border-white/20 hover:border-white transition-all cursor-pointer flex items-center justify-center font-black text-xs text-white shadow-md select-none ${
                    profile?.color || 'bg-red-600'
                  } ${isFriendsTheme ? 'ring-[3px] ring-[#eab308] ring-offset-2 ring-offset-zinc-950 shadow-[0_0_12px_rgba(234,179,8,0.55)]' : ''}`}
                >
                  {profile ? profile.name[0] : 'V'}
                </div>

                {showProfile && (
                  <div className="absolute right-0 top-12 w-56 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 flex flex-col text-xs">
                    <div className="px-3 py-2.5 border-b border-white/5 mb-1 flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${profile?.color || 'bg-red-600'} flex items-center justify-center text-white font-bold text-[10px] ${isFriendsTheme ? 'ring-2 ring-[#eab308]' : ''}`}>
                        {profile ? profile.name[0] : 'V'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{profile?.name || 'Vaibhav'}</div>
                        <div className="text-[10px] text-zinc-500">Active Profile</div>
                      </div>
                    </div>

                    {onOpenLounge && (
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          soundFx.playPop();
                          onOpenLounge();
                        }}
                        className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Tv size={14} className="text-zinc-400" />
                        <span>Lounge Screensaver</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        setIsThemeModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Palette size={14} className="text-zinc-400" />
                        <span>Theme</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 truncate max-w-[80px]">{currentTheme.badge}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        navigate('/studio');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Film size={14} className="text-emerald-400" />
                      <span>Memory Studio</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        navigate('/jukebox');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Disc3 size={14} className="text-zinc-400" />
                      <span>Squad Jukebox</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        navigate('/stats');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <BarChart2 size={14} className="text-zinc-400" />
                      <span>Insights & Activity</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        navigate('/developer');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Settings size={14} className="text-zinc-400" />
                      <span>Preferences & Console</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        navigate('/');
                      }}
                      className="w-full px-3 py-2 text-left text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <User size={14} className="text-zinc-400" />
                      <span>Switch Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfile(false);
                        soundFx.playPop();
                        lockDostflix();
                      }}
                      className="w-full px-3 py-2 text-left text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-colors flex items-center gap-2 font-medium border-t border-white/5 mt-1"
                    >
                      <Lock size={14} className="text-amber-400" />
                      <span>Lock Dostflix</span>
                    </button>

                    <button
                      onClick={() => {
                        localStorage.removeItem('activeProfile');
                        navigate('/');
                      }}
                      className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-600/10 rounded-xl transition-colors font-semibold"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Bottom Floating Navigation Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl px-2 py-2 shadow-2xl flex items-center justify-around select-none">
        {NAV_LINKS.map(link => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              onClick={() => {
                soundFx.playPop();
                navigate(link.path);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{ color: isActive ? currentTheme.colors.accent : undefined }}
            >
              <Icon size={17} />
              <span className="text-[9px] font-medium">{link.label}</span>
            </button>
          );
        })}

        {/* Mobile Lounge Screensaver trigger */}
        {onOpenLounge && (
          <button
            onClick={() => {
              soundFx.playPop();
              onOpenLounge();
            }}
            className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-zinc-400 hover:text-white transition-all"
          >
            <Tv size={17} />
            <span className="text-[9px] font-medium">Lounge</span>
          </button>
        )}

        {/* Mobile Theme trigger */}
        <button
          onClick={() => {
            soundFx.playPop();
            setIsThemeModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-zinc-400 hover:text-white transition-all"
        >
          <Palette size={17} />
          <span className="text-[9px] font-medium">Theme</span>
        </button>

        {/* Mobile Lock trigger */}
        <button
          onClick={() => {
            soundFx.playPop();
            lockDostflix();
          }}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-zinc-400 hover:text-amber-400 transition-all"
          title="Lock Dostflix"
        >
          <Lock size={17} />
          <span className="text-[9px] font-medium">Lock</span>
        </button>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
}
