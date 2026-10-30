import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

const TRACKS = {
  friends: {
    id: 'friends',
    title: "I'll Be There for You",
    artist: "The Rembrandts",
    subtitle: "Central Perk Vibes • F·R·I·E·N·D·S Theme",
    src: '/friends-theme.mp3'
  },
  default: {
    id: 'default',
    title: "DostFlix Original Soundtrack",
    artist: "DostFlix OST",
    subtitle: "Ambient Memories • Lo-fi Vibes",
    src: '/background.mp3'
  }
};

function isSameTrack(audioSrc, trackSrc) {
  if (!audioSrc) return false;
  try {
    const url = new URL(audioSrc, window.location.href);
    return url.pathname === trackSrc || url.pathname.endsWith(trackSrc);
  } catch (e) {
    return audioSrc.endsWith(trackSrc);
  }
}

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const { currentTheme } = useTheme();
  const themeId = currentTheme?.id;

  const [currentTrack, setCurrentTrack] = useState(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('dostflix_theme') : null;
    return savedTheme === 'friends' ? TRACKS.friends : TRACKS.default;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.4);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const audioRef = useRef(null);

  // Initialize Audio instance once
  useEffect(() => {
    const initialTrack = themeId === 'friends' ? TRACKS.friends : TRACKS.default;
    const audio = new Audio(initialTrack.src);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsReady(true);
      }
    };
    const handleCanPlay = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setIsReady(true);
    };
    const handleDurationChange = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleVolumeChange = () => {
      setVolumeState(audio.volume);
      setIsMuted(audio.muted);
    };
    const handleEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };
    const handleError = (e) => {
      console.warn("Audio element error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // When theme changes externally or via modal
  useEffect(() => {
    const targetTrack = themeId === 'friends' ? TRACKS.friends : TRACKS.default;
    setCurrentTrack(targetTrack);

    const audio = audioRef.current;
    if (!audio) return;

    // Check if source needs updating
    if (!isSameTrack(audio.src, targetTrack.src)) {
      const wasPlaying = !audio.paused;
      audio.pause();
      audio.src = targetTrack.src;
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      audio.load();

      // If user was already listening, continue playing smoothly
      if (wasPlaying) {
        audio.play().catch((err) => {
          console.warn("Playback error on theme switch:", err);
          setIsPlaying(false);
        });
      }
    }
  }, [themeId]);

  // Directly play a specific track (supported inside synchronous user clicks)
  const playTrack = async (targetThemeId = 'friends') => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetTrack = targetThemeId === 'friends' ? TRACKS.friends : TRACKS.default;
    setCurrentTrack(targetTrack);

    if (!isSameTrack(audio.src, targetTrack.src)) {
      audio.pause();
      audio.src = targetTrack.src;
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      audio.load();
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("playTrack error:", err);
    }
  };

  // Switch track without forcing playback if paused
  const switchTrack = (targetThemeId = 'default') => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetTrack = targetThemeId === 'friends' ? TRACKS.friends : TRACKS.default;
    const wasPlaying = !audio.paused;
    setCurrentTrack(targetTrack);

    if (!isSameTrack(audio.src, targetTrack.src)) {
      audio.pause();
      audio.src = targetTrack.src;
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      audio.load();

      if (wasPlaying) {
        audio.play().catch((err) => {
          console.warn("switchTrack play failed:", err);
        });
      }
    }
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isSameTrack(audio.src, currentTrack.src)) {
      audio.src = currentTrack.src;
      audio.load();
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("toggleMusic play error:", err);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const pauseMusic = () => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const resumeMusic = () => {
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.play().catch(() => {});
    }
  };

  const seek = (timeInSeconds) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || !Number.isFinite(audio.duration)) return;
    try {
      const clamped = Math.max(0, Math.min(timeInSeconds, audio.duration));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    } catch (e) {
      console.warn("seek error:", e);
    }
  };

  const skip = (deltaSeconds) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || !Number.isFinite(audio.duration)) return;
    seek(audio.currentTime + deltaSeconds);
  };

  const setVolume = (level) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(1, level));
    audio.volume = clamped;
    audio.muted = clamped === 0;
    setVolumeState(clamped);
    setIsMuted(audio.muted);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      const restoredVol = volume > 0 ? volume : 0.4;
      audio.volume = restoredVol;
      setVolumeState(restoredVol);
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isReady,
        toggleMusic,
        playTrack,
        switchTrack,
        pauseMusic,
        resumeMusic,
        seek,
        skip,
        setVolume,
        toggleMute,
        currentTrack
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export const useMusic = () => useContext(AudioContext);
