import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Paintbrush, Eraser, Square, Circle, Minus, Download, Trash2, 
  Undo, Redo, Pipette, Type 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type Tool = "brush" | "eraser" | "line" | "rectangle" | "circle" | "fill" | "text";

interface DrawAction {
  imageData: ImageData;
}

const COLORS = [
  "#000000", "#ffffff", "#ff0000", "#ff6b00", "#ffff00", "#00ff00",
  "#00ffff", "#0000ff", "#ff00ff", "#800000", "#808000", "#008000",
  "#008080", "#000080", "#800080", "#808080", "#c0c0c0", "#ff69b4",
];

export function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev.slice(-20), { imageData }]);
    setRedoStack([]);
  }, []);

  const undo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];
    
    setRedoStack(prev => [...prev, current]);
    setUndoStack(prev => prev.slice(0, -1));
    ctx.putImageData(previous.imageData, 0, 0);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    ctx.putImageData(action.imageData, 0, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPos(pos);
    lastPos.current = pos;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.stroke();
    } else if (tool === "fill") {
      floodFill(pos.x, pos.y, color);
      saveState();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPos.current?.x || pos.x, lastPos.current?.y || pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.stroke();
      lastPos.current = pos;
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) {
      setIsDrawing(false);
      return;
    }

    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      setIsDrawing(false);
      return;
    }

    if (tool === "line") {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    } else if (tool === "rectangle") {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    }

    saveState();
    setIsDrawing(false);
    setStartPos(null);
    lastPos.current = null;
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const startIdx = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];

    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);

    if (startR === fillR && startG === fillG && startB === fillB) return;

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      
      const idx = (y * canvas.width + x) * 4;
      if (data[idx] !== startR || data[idx + 1] !== startG || data[idx + 2] !== startB) continue;

      visited.add(key);
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const tools: { id: Tool; icon: typeof Paintbrush; label: string }[] = [
    { id: "brush", icon: Paintbrush, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "fill", icon: Pipette, label: "Fill" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900" data-testid="paint-app">
      <div className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-800 border-b">
        <div className="flex gap-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant={tool === id ? "default" : "ghost"}
              size="icon"
              onClick={() => setTool(id)}
              title={label}
              data-testid={`button-tool-${id}`}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-400 mx-2" />

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={undoStack.length <= 1} data-testid="button-undo">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0} data-testid="button-redo">
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-400 mx-2" />

        <Button variant="ghost" size="icon" onClick={clearCanvas} title="Clear" data-testid="button-clear">
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={downloadCanvas} title="Download" data-testid="button-download">
          <Download className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-400 mx-2" />

        <div className="flex items-center gap-2">
          <span className="text-sm">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={([value]) => setBrushSize(value)}
            min={1}
            max={50}
            step={1}
            className="w-24"
          />
          <span className="text-sm w-6">{brushSize}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-12 bg-gray-200 dark:bg-gray-800 p-1 flex flex-col gap-1 border-r overflow-y-auto">
          {COLORS.map(c => (
            <button
              key={c}
              className={`w-8 h-8 rounded border-2 ${color === c ? "border-blue-500" : "border-gray-400"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              data-testid={`color-${c.replace("#", "")}`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 cursor-pointer"
            data-testid="color-picker"
          />
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-300 dark:bg-gray-700">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-white shadow-lg cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            data-testid="canvas"
          />
        </div>
      </div>
    </div>
  );
}
