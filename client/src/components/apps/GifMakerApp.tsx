import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Play, Pause, Download, Image as ImageIcon, X, Film, Loader2 } from "lucide-react";

interface Frame {
  id: string;
  dataUrl: string;
  canvas: HTMLCanvasElement;
}

export function GifMakerApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameDelay, setFrameDelay] = useState(200);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const colors = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8000", "#8000ff"];

  useEffect(() => {
    clearCanvas();
  }, []);

  const getContext = () => {
    const canvas = canvasRef.current;
    return canvas?.getContext("2d");
  };

  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const loadFrameToCanvas = useCallback((index: number) => {
    if (frames[index]) {
      const ctx = getContext();
      const canvas = canvasRef.current;
      if (ctx && canvas) {
        ctx.drawImage(frames[index].canvas, 0, 0);
      }
    } else {
      clearCanvas();
    }
  }, [frames, clearCanvas]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = getContext();
    if (ctx) {
      ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const addFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = canvas.width;
    frameCanvas.height = canvas.height;
    const frameCtx = frameCanvas.getContext("2d");
    if (frameCtx) {
      frameCtx.drawImage(canvas, 0, 0);
    }

    const newFrame: Frame = {
      id: Date.now().toString(),
      dataUrl: canvas.toDataURL("image/png"),
      canvas: frameCanvas,
    };

    setFrames(prev => [...prev, newFrame]);
    clearCanvas();
  };

  const deleteFrame = (index: number) => {
    setFrames(prev => prev.filter((_, i) => i !== index));
    if (currentFrameIndex >= frames.length - 1) {
      setCurrentFrameIndex(Math.max(0, frames.length - 2));
    }
  };

  const selectFrame = (index: number) => {
    setCurrentFrameIndex(index);
    loadFrameToCanvas(index);
  };

  const togglePlay = () => {
    if (frames.length < 2) return;

    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      let frameIndex = 0;
      playIntervalRef.current = setInterval(() => {
        loadFrameToCanvas(frameIndex);
        setCurrentFrameIndex(frameIndex);
        frameIndex = (frameIndex + 1) % frames.length;
      }, frameDelay);
    }
  };

  const exportGif = async () => {
    if (frames.length < 2) return;
    
    setIsExporting(true);
    
    try {
      const GIF = (await import("gif.js")).default;
      
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 300,
        height: 300,
        workerScript: "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js",
      });

      frames.forEach(frame => {
        gif.addFrame(frame.canvas, { delay: frameDelay, copy: true });
      });

      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "animation.gif";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      });

      gif.render();
    } catch (error) {
      console.error("Error exporting GIF:", error);
      downloadFramesAsPng();
      setIsExporting(false);
    }
  };

  const downloadFramesAsPng = () => {
    frames.forEach((frame, index) => {
      const link = document.createElement("a");
      link.download = `frame-${index + 1}.png`;
      link.href = frame.dataUrl;
      link.click();
    });
  };

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 to-indigo-900 p-4" data-testid="gifmaker-app">
      <h1 className="text-2xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
        <Film className="w-6 h-6" />
        GIF Maker
      </h1>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-lg p-2">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="border border-gray-300 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              data-testid="drawing-canvas"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: color }}
                data-testid={`color-${color}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4 text-white">
            <span className="text-sm">Brush Size:</span>
            <Slider
              value={[brushSize]}
              onValueChange={([value]) => setBrushSize(value)}
              min={1}
              max={20}
              step={1}
              className="w-32"
            />
            <span className="text-sm w-8">{brushSize}px</span>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearCanvas} variant="outline" size="sm">
              Clear
            </Button>
            <Button onClick={addFrame} size="sm" data-testid="button-add-frame">
              <Plus className="w-4 h-4 mr-1" />
              Add Frame
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Button
              onClick={togglePlay}
              disabled={frames.length < 2}
              variant="outline"
              data-testid="button-play"
            >
              {isPlaying ? (
                <><Pause className="w-4 h-4 mr-2" /> Stop</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Preview</>
              )}
            </Button>

            <div className="flex items-center gap-2 text-white">
              <span className="text-sm">Speed:</span>
              <Slider
                value={[frameDelay]}
                onValueChange={([value]) => setFrameDelay(value)}
                min={50}
                max={500}
                step={50}
                className="w-24"
              />
              <span className="text-sm w-16">{frameDelay}ms</span>
            </div>

            <Button
              onClick={exportGif}
              disabled={frames.length < 2 || isExporting}
              variant="secondary"
              size="sm"
              data-testid="button-download"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  Export GIF
                </>
              )}
            </Button>
          </div>

          <div className="text-white text-sm mb-2">
            Frames ({frames.length}) {frames.length < 2 && <span className="text-yellow-400">- Add at least 2 frames</span>}
          </div>

          <div className="flex-1 overflow-y-auto">
            {frames.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No frames yet. Draw and click "Add Frame"</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {frames.map((frame, index) => (
                  <div
                    key={frame.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                      currentFrameIndex === index ? "border-white" : "border-transparent"
                    }`}
                    onClick={() => selectFrame(index)}
                    data-testid={`frame-${index}`}
                  >
                    <img
                      src={frame.dataUrl}
                      alt={`Frame ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFrame(index); }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
