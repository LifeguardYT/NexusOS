import { useState, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Heart, ListMusic } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
}

const mockPlaylist: Track[] = [
  { id: "1", title: "Midnight Dreams", artist: "Aurora Wave", album: "Nocturnal", duration: 234, cover: "1" },
  { id: "2", title: "Electric Sunrise", artist: "Neon Pulse", album: "Voltage", duration: 198, cover: "2" },
  { id: "3", title: "Ocean Breeze", artist: "Coastal Sounds", album: "Serenity", duration: 267, cover: "3" },
  { id: "4", title: "City Lights", artist: "Urban Echo", album: "Metropolis", duration: 215, cover: "4" },
  { id: "5", title: "Forest Path", artist: "Nature Beats", album: "Wilderness", duration: 289, cover: "5" },
  { id: "6", title: "Starlight", artist: "Cosmic Journey", album: "Galaxy", duration: 245, cover: "6" },
];

export function MusicApp() {
  const [currentTrack, setCurrentTrack] = useState<Track>(mockPlaylist[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    const currentIndex = mockPlaylist.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % mockPlaylist.length;
    setCurrentTrack(mockPlaylist[nextIndex]);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      setCurrentTime(0);
    } else {
      const currentIndex = mockPlaylist.findIndex(t => t.id === currentTrack.id);
      const prevIndex = currentIndex === 0 ? mockPlaylist.length - 1 : currentIndex - 1;
      setCurrentTrack(mockPlaylist[prevIndex]);
      setCurrentTime(0);
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
      {/* Now Playing */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Album Art */}
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-pink-600/50" />
          <Music className="w-20 h-20 text-white/80 relative z-10" />
        </div>

        {/* Track Info */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">{currentTrack.title}</h2>
          <p className="text-white/60">{currentTrack.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm mb-4">
          <Slider
            value={[currentTime]}
            onValueChange={([value]) => setCurrentTime(value)}
            max={currentTrack.duration}
            step={1}
            className="w-full"
            data-testid="slider-music-progress"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Controls */}
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

        {/* Volume */}
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

      {/* Playlist */}
      <div className="h-48 border-t border-white/10 overflow-auto">
        <div className="px-4 py-2 flex items-center gap-2 text-white/60 text-xs uppercase tracking-wide">
          <ListMusic className="w-4 h-4" />
          <span>Up Next</span>
        </div>
        {mockPlaylist.map(track => (
          <button
            key={track.id}
            onClick={() => {
              setCurrentTrack(track);
              setCurrentTime(0);
              setIsPlaying(true);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 transition-colors ${
              currentTrack.id === track.id ? "bg-white/10" : "hover:bg-white/5"
            }`}
            data-testid={`track-${track.id}`}
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500/50 to-pink-500/50 flex items-center justify-center">
              <Music className="w-5 h-5 text-white/60" />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm ${currentTrack.id === track.id ? "text-green-400" : ""}`}>{track.title}</p>
              <p className="text-xs text-white/50">{track.artist}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
              className="p-1"
            >
              <Heart className={`w-4 h-4 ${liked.has(track.id) ? "fill-red-500 text-red-500" : "text-white/30"}`} />
            </button>
            <span className="text-xs text-white/50">{formatTime(track.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
