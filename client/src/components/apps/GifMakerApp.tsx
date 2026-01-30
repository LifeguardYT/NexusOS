import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Play, Pause, Download, Image as ImageIcon, X, Film, Loader2, AlertCircle } from "lucide-react";

interface Frame {
  id: string;
  dataUrl: string;
  imageData: ImageData;
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
  const [exportError, setExportError] = useState<string | null>(null);
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
        ctx.putImageData(frames[index].imageData, 0, 0);
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
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const newFrame: Frame = {
      id: Date.now().toString(),
      dataUrl: canvas.toDataURL("image/png"),
      imageData: imageData,
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
    setExportError(null);
    
    try {
      const width = 300;
      const height = 300;
      const delayCs = Math.round(frameDelay / 10);
      
      const chunks: number[] = [];
      
      const writeString = (s: string) => {
        for (let i = 0; i < s.length; i++) {
          chunks.push(s.charCodeAt(i));
        }
      };
      
      const writeByte = (b: number) => chunks.push(b & 0xff);
      const writeShort = (s: number) => {
        writeByte(s & 0xff);
        writeByte((s >> 8) & 0xff);
      };
      
      // Build a 256-color palette with common colors
      // Use a 6x6x6 color cube (216 colors) plus 40 grayscale shades
      const palette: number[][] = [];
      
      // 6x6x6 color cube = 216 colors
      for (let r = 0; r < 6; r++) {
        for (let g = 0; g < 6; g++) {
          for (let b = 0; b < 6; b++) {
            palette.push([Math.round(r * 51), Math.round(g * 51), Math.round(b * 51)]);
          }
        }
      }
      
      // Add 40 extra grayscale values for smoother gradients
      for (let i = 0; i < 40; i++) {
        const gray = Math.round((i / 39) * 255);
        palette.push([gray, gray, gray]);
      }
      
      // Find closest palette color for a given RGB
      const findClosestColor = (r: number, g: number, b: number): number => {
        let bestIndex = 0;
        let bestDist = Infinity;
        for (let i = 0; i < palette.length; i++) {
          const pr = palette[i][0];
          const pg = palette[i][1];
          const pb = palette[i][2];
          const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        }
        return bestIndex;
      };
      
      writeString("GIF89a");
      writeShort(width);
      writeShort(height);
      writeByte(0xf7); // Global color table flag, 256 colors
      writeByte(0);
      writeByte(0);
      
      // Write color palette (256 RGB triplets)
      for (let i = 0; i < 256; i++) {
        if (i < palette.length) {
          writeByte(palette[i][0]);
          writeByte(palette[i][1]);
          writeByte(palette[i][2]);
        } else {
          writeByte(0);
          writeByte(0);
          writeByte(0);
        }
      }
      
      // NETSCAPE extension for looping
      writeByte(0x21);
      writeByte(0xff);
      writeByte(11);
      writeString("NETSCAPE2.0");
      writeByte(3);
      writeByte(1);
      writeShort(0); // Loop forever
      writeByte(0);
      
      for (const frame of frames) {
        const { imageData } = frame;
        const pixels = imageData.data;
        
        // Graphics Control Extension
        writeByte(0x21);
        writeByte(0xf9);
        writeByte(4);
        writeByte(0);
        writeShort(delayCs);
        writeByte(0);
        writeByte(0);
        
        // Image Descriptor
        writeByte(0x2c);
        writeShort(0);
        writeShort(0);
        writeShort(width);
        writeShort(height);
        writeByte(0); // No local color table
        
        // Convert pixels to palette indices with actual colors
        const indexedPixels: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          indexedPixels.push(findClosestColor(r, g, b));
        }
        
        const minCodeSize = 8;
        writeByte(minCodeSize);
        
        const lzwEncode = (pixels: number[], minCodeSize: number): number[] => {
          const clearCode = 1 << minCodeSize;
          const eoiCode = clearCode + 1;
          const output: number[] = [];
          let bitBuffer = 0;
          let bitCount = 0;
          
          const writeBits = (code: number, bits: number) => {
            bitBuffer |= code << bitCount;
            bitCount += bits;
            while (bitCount >= 8) {
              output.push(bitBuffer & 0xff);
              bitBuffer >>= 8;
              bitCount -= 8;
            }
          };
          
          let codeSize = minCodeSize + 1;
          let nextCode = eoiCode + 1;
          const maxCode = 4095;
          const dictionary = new Map<string, number>();
          
          for (let i = 0; i < clearCode; i++) {
            dictionary.set(String(i), i);
          }
          
          writeBits(clearCode, codeSize);
          
          let current = "";
          for (let i = 0; i < pixels.length; i++) {
            const pixel = String(pixels[i]);
            const combined = current ? current + "," + pixel : pixel;
            
            if (dictionary.has(combined)) {
              current = combined;
            } else {
              writeBits(dictionary.get(current)!, codeSize);
              
              if (nextCode <= maxCode) {
                dictionary.set(combined, nextCode++);
                if (nextCode > (1 << codeSize) && codeSize < 12) {
                  codeSize++;
                }
              }
              
              current = pixel;
            }
          }
          
          if (current) {
            writeBits(dictionary.get(current)!, codeSize);
          }
          
          writeBits(eoiCode, codeSize);
          
          if (bitCount > 0) {
            output.push(bitBuffer & 0xff);
          }
          
          return output;
        };
        
        const lzwData = lzwEncode(indexedPixels, minCodeSize);
        
        let offset = 0;
        while (offset < lzwData.length) {
          const chunkSize = Math.min(255, lzwData.length - offset);
          writeByte(chunkSize);
          for (let i = 0; i < chunkSize; i++) {
            writeByte(lzwData[offset + i]);
          }
          offset += chunkSize;
        }
        writeByte(0);
      }
      
      writeByte(0x3b); // GIF trailer
      
      const blob = new Blob([new Uint8Array(chunks)], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "animation.gif";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
    } catch (error) {
      console.error("Error exporting GIF:", error);
      setExportError("Failed to export GIF. Please try again.");
      setIsExporting(false);
    }
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

          {exportError && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              {exportError}
            </div>
          )}

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
