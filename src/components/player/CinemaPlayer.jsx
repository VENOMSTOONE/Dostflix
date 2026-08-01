import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CinemaPlayer({ isOpen, onClose, mediaAsset, memoryId }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      // Restore progress if possible
      const saved = localStorage.getItem(`DostFlix_progress_${memoryId}`);
      if (saved) {
        const { percentage } = JSON.parse(saved);
        if (percentage < 95) { // If not almost finished, resume
          videoRef.current.addEventListener('loadedmetadata', () => {
            if (videoRef.current) {
              videoRef.current.currentTime = (percentage / 100) * videoRef.current.duration;
            }
          });
        }
      }
    }
  }, [isOpen, memoryId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'r' || e.key === 'R') {
        videoRef.current?.load();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  if (!isOpen) return null;

  const isVideo = mediaAsset?.endsWith('.mp4');

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.log(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      const pct = (current / total) * 100;
      setProgress(pct);
      // Persist progress
      localStorage.setItem(`DostFlix_progress_${memoryId}`, JSON.stringify({ progress: pct }));
    }
  };

  const handleProgressChange = (e) => {
    if (videoRef.current) {
      const newProgress = parseFloat(e.target.value);
      const total = videoRef.current.duration;
      videoRef.current.currentTime = (newProgress / 100) * total;
      setProgress(newProgress);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center select-none"
    >
      {/* Top Header Controls */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-50">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase bg-accent text-black font-extrabold px-2 py-0.5 rounded tracking-wide">
            Cinema Mode
          </span>
          <span className="text-xs text-primary/60 font-light hidden md:inline">
            Press [Space] to Pause &bull; [F] for Fullscreen &bull; [Esc] to Exit
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-95"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Screen Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaAsset}
            className="max-w-full max-h-full object-contain pointer-events-auto"
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
          />
        ) : (
          <img
            src={mediaAsset}
            alt="memory media"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Bottom Controls (Only for video) */}
      {isVideo && (
        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-4 z-50">
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-primary/60 font-semibold min-w-[40px]">
              {videoRef.current ? Math.floor(videoRef.current.currentTime) : '00'}:00
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <span className="text-xs text-primary/60 font-semibold min-w-[40px]">
              {videoRef.current ? Math.floor(videoRef.current.duration) : '00'}:00
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-accent transition-colors">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
            </div>
            <button onClick={toggleFullscreen} className="text-white hover:text-accent transition-colors">
              {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
