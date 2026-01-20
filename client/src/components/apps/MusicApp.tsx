import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Heart, ListMusic, Music, Upload, Trash2, Plus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  audioUrl: string;
}

const UPLOADED_MUSIC_KEY = "nexusOS_uploadedMusic";

export function MusicApp() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem(UPLOADED_MUSIC_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(tracks[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(UPLOADED_MUSIC_KEY, JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    if (currentTrack?.audioUrl && audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.volume = volume / 100;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (currentTrack?.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(Math.floor(audioRef.current.currentTime));
    }
  };

  const handleAudioEnded = () => {
    if (isRepeating && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setCurrentTime(0);
    } else {
      handleNext();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith("audio/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const audioUrl = reader.result as string;
          const audio = new Audio(audioUrl);
          
          audio.onloadedmetadata = () => {
            const newTrack: Track = {
              id: `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: file.name.replace(/\.[^/.]+$/, ""),
              artist: "My Music",
              album: "Uploaded",
              duration: Math.floor(audio.duration),
              audioUrl,
            };
            setTracks(prev => {
              const updated = [...prev, newTrack];
              if (!currentTrack) {
                setCurrentTrack(newTrack);
              }
              return updated;
            });
          };
        };
        reader.readAsDataURL(file);
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    setTracks(prev => {
      const updated = prev.filter(t => t.id !== trackId);
      if (currentTrack?.id === trackId) {
        setCurrentTrack(updated[0] || null);
        setCurrentTime(0);
        setIsPlaying(false);
      }
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (tracks.length === 0) return;
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
      setCurrentTrack(tracks[prevIndex]);
      setCurrentTime(0);
    }
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
    if (audioRef.current && currentTrack?.audioUrl) {
      audioRef.current.currentTime = value;
    }
  };

  const toggleLike = (trackId: string) => {
    setLiked(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(trackId)) {
        newLiked.delete(trackId);
      } else {
        newLiked.add(trackId);
      }
      return newLiked;
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-purple-900 via-gray-900 to-black text-white">
      <audio
        ref={audioRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        data-testid="input-upload-music"
      />
      
      {tracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <Music className="w-16 h-16 text-white/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Music Yet</h2>
          <p className="text-white/60 text-center mb-6">Upload your own music to start listening</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-500 hover:bg-green-600 text-white"
            data-testid="btn-upload-music-empty"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Music
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-pink-600/50" />
              <Music className="w-20 h-20 text-white/80 relative z-10" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">{currentTrack?.title || "No track selected"}</h2>
              <p className="text-white/60">{currentTrack?.artist || ""}</p>
            </div>

            <div className="w-full max-w-sm mb-4">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => handleSeek(value)}
                max={currentTrack?.duration || 1}
                step={1}
                className="w-full"
                data-testid="slider-music-progress"
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(currentTrack?.duration || 0)}</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`p-2 rounded-full transition-colors ${isShuffled ? "text-green-400" : "text-white/60 hover:text-white"}`}
                data-testid="btn-shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrevious}
                className="p-2 text-white hover:text-white/80 transition-colors"
                data-testid="btn-previous"
              >
                <SkipBack className="w-7 h-7" />
              </button>
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
                data-testid="btn-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-black" />
                ) : (
                  <Play className="w-7 h-7 text-black ml-1" />
                )}
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-white hover:text-white/80 transition-colors"
                data-testid="btn-next"
              >
                <SkipForward className="w-7 h-7" />
              </button>
              <button
                onClick={() => setIsRepeating(!isRepeating)}
                className={`p-2 rounded-full transition-colors ${isRepeating ? "text-green-400" : "text-white/60 hover:text-white"}`}
                data-testid="btn-repeat"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-6 w-full max-w-[200px]">
              <Volume2 className="w-4 h-4 text-white/60" />
              <Slider
                value={[volume]}
                onValueChange={([value]) => setVolume(value)}
                max={100}
                step={1}
                className="flex-1"
                data-testid="slider-volume"
              />
            </div>
          </div>

          <div className="h-56 border-t border-white/10 overflow-auto">
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wide">
                <ListMusic className="w-4 h-4" />
                <span>Your Music ({tracks.length})</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-7"
                data-testid="btn-upload-music"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Music
              </Button>
            </div>
            {tracks.map(track => (
              <div
                key={track.id}
                onClick={() => {
                  setCurrentTrack(track);
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition-colors cursor-pointer ${
                  currentTrack?.id === track.id ? "bg-white/10" : "hover:bg-white/5"
                }`}
                data-testid={`track-${track.id}`}
              >
                <div className="w-10 h-10 rounded bg-gradient-to-br from-green-500/50 to-teal-500/50 flex items-center justify-center">
                  <Music className="w-5 h-5 text-white/60" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm truncate ${currentTrack?.id === track.id ? "text-green-400" : ""}`}>{track.title}</p>
                  <p className="text-xs text-white/50 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
                  className="p-1"
                >
                  <Heart className={`w-4 h-4 ${liked.has(track.id) ? "fill-red-500 text-red-500" : "text-white/30"}`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTrack(track.id); }}
                  className="p-1 text-white/30 hover:text-red-400"
                  data-testid={`btn-delete-track-${track.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="text-xs text-white/50 w-10 text-right">{formatTime(track.duration)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
