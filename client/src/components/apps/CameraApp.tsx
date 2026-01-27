import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Video, Download, Trash2, FlipHorizontal, Settings, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Photo {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

export function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");
    const newPhoto: Photo = {
      id: Date.now().toString(),
      dataUrl,
      timestamp: new Date(),
    };

    setPhotos(prev => [newPhoto, ...prev]);
  };

  const takePhotoWithCountdown = () => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        takePhoto();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement("a");
    link.download = `photo-${photo.timestamp.toISOString()}.png`;
    link.href = photo.dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900" data-testid="camera-app">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <h2 className="text-white font-medium">Camera</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMirrored(!isMirrored)}
            className="text-white"
            data-testid="button-mirror"
          >
            <FlipHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGallery(!showGallery)}
            className="text-white relative"
            data-testid="button-gallery"
          >
            <Image className="w-4 h-4" />
            {photos.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {photos.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center bg-black">
          {error ? (
            <div className="text-center p-8">
              <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={startCamera} data-testid="button-retry">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-full object-contain"
                style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                data-testid="video-preview"
              />
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {showGallery && (
          <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-2 border-b border-gray-700 flex justify-between items-center">
              <span className="text-white text-sm font-medium">Gallery ({photos.length})</span>
              <Button variant="ghost" size="icon" onClick={() => setShowGallery(false)} className="text-gray-400 h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {photos.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No photos yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                      data-testid={`photo-${photo.id}`}
                    >
                      <img
                        src={photo.dataUrl}
                        alt="Captured"
                        className="w-full aspect-square object-cover rounded"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white"
                          onClick={e => { e.stopPropagation(); downloadPhoto(photo); }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white hover:text-red-400"
                          onClick={e => { e.stopPropagation(); deletePhoto(photo.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-center gap-4">
        <Button
          size="icon"
          variant="secondary"
          onClick={takePhoto}
          disabled={!stream || countdown !== null}
          className="rounded-full"
          data-testid="button-capture"
        >
          <Camera className="w-6 h-6" />
        </Button>
        <Button
          variant="outline"
          onClick={takePhotoWithCountdown}
          disabled={!stream || countdown !== null}
          data-testid="button-timer"
        >
          3s Timer
        </Button>
      </div>

      {selectedPhoto && (
        <div className="absolute inset-0 bg-black/90 flex flex-col z-50" data-testid="photo-viewer">
          <div className="flex justify-between items-center p-2 bg-gray-800">
            <span className="text-white text-sm">
              {selectedPhoto.timestamp.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => downloadPhoto(selectedPhoto)} className="text-white">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deletePhoto(selectedPhoto.id)} className="text-white hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)} className="text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={selectedPhoto.dataUrl} alt="Selected" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
