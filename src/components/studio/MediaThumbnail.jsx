import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, AlertCircle, X, Check, Play } from 'lucide-react';
import { resolveMediaUrl } from '../../services/indexedDbStorage';

/**
 * Robust MediaThumbnail Component
 * - Resolves media preview using resolveMediaUrl
 * - NEVER renders an empty black box on decode failure or unsupported format
 * - Displays video badges and durations
 * - Graceful fallback with file icon, format badge, and truncated filename
 * - Hover remove button and lightbox click support
 */
export default function MediaThumbnail({
  item,
  aspectRatio = 'square', // 'square' | 'video' | 'auto'
  onClick,
  onRemove,
  selectable = false,
  selected = false,
  onSelect,
  className = '',
  showFilename = false,
  showBadges = true,
}) {
  const [hasError, setHasError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isVideo = item?.mediaType === 'video' || item?.fileType?.startsWith('video/') || Boolean(item?.originalFilename?.match(/\.(mp4|mov|webm|m4v)$/i));
  const filename = item?.originalFilename || item?.name || 'media_file';
  const extension = filename.split('.').pop()?.toUpperCase() || (isVideo ? 'VIDEO' : 'IMAGE');

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setIsLoading(true);

    try {
      const url = resolveMediaUrl(item);
      if (url) {
        if (isMounted) {
          setResolvedSrc(url);
          setIsLoading(false);
        }
      } else {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    } catch (e) {
      if (isMounted) {
        setHasError(true);
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [item]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const aspectClass = aspectRatio === 'square' 
    ? 'aspect-square' 
    : aspectRatio === 'video' 
      ? 'aspect-video' 
      : 'aspect-square';

  const isUnsupported = Boolean(item?.isUnsupportedPreview) || hasError || !resolvedSrc;

  return (
    <div className={`relative flex flex-col group ${className}`}>
      <div
        onClick={() => onClick?.(item)}
        className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-zinc-900 border border-white/10 transition-all duration-200 ${
          onClick ? 'cursor-pointer hover:border-white/30 hover:shadow-lg hover:scale-[1.02]' : ''
        } ${selected ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}
      >
        {/* Loading placeholder skeleton */}
        {isLoading && !isUnsupported && (
          <div className="absolute inset-0 bg-zinc-800/80 animate-pulse flex items-center justify-center">
            <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        )}

        {/* Successful Image / Poster Render */}
        {!isUnsupported && resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={filename}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : (
          /* Informative Fallback for HEIC, RAW, or decodable failures — NEVER an empty black box */
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/90 to-zinc-900/95 flex flex-col items-center justify-center p-2 text-center select-none">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1 text-zinc-300">
              {isVideo ? <Video size={16} /> : <ImageIcon size={16} />}
            </div>
            <span className="text-[10px] font-bold text-zinc-300 tracking-wider px-1.5 py-0.5 rounded bg-white/10 mb-1 uppercase">
              {extension}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-full px-1">
              {filename}
            </span>
            {item?.fileSize && (
              <span className="text-[9px] text-zinc-500 mt-0.5">
                {formatFileSize(item.fileSize)}
              </span>
            )}
          </div>
        )}

        {/* Video indicator overlay badge */}
        {isVideo && showBadges && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-white flex items-center gap-1 text-[10px] font-semibold pointer-events-none">
            <Play size={9} className="fill-white" />
            {formatDuration(item?.duration) && <span>{formatDuration(item.duration)}</span>}
          </div>
        )}

        {/* Selection Checkbox */}
        {selectable && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(item);
            }}
            className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
              selected 
                ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md' 
                : 'bg-black/60 border-white/30 text-transparent hover:border-white/60 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Check size={12} strokeWidth={3} />
          </div>
        )}

        {/* Remove Button (Hover subtle overlay, does not block thumbnail) */}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
            title="Remove file"
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-red-500 border border-white/20 hover:border-red-400 text-zinc-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Optional Filename Caption */}
      {showFilename && (
        <div className="mt-1.5 px-0.5">
          <p className="text-[11px] font-medium text-zinc-300 truncate" title={filename}>
            {filename}
          </p>
          <p className="text-[9px] text-zinc-500">
            {formatFileSize(item?.fileSize)}
          </p>
        </div>
      )}
    </div>
  );
}
