import { useState, useRef, useCallback, useEffect } from "react";
import { useOS } from "@/lib/os-context";
import type { WindowState } from "@shared/schema";
import { Minus, Square, X, Maximize2 } from "lucide-react";

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export function Window({ window: win, children }: WindowProps) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition, updateWindowSize } = useOS();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    focusWindow(win.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    });
  }, [win.id, win.x, win.y, focusWindow]);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    setIsResizing(true);
    setResizeDir(direction);
    setInitialSize({ width: win.width, height: win.height });
    setInitialPos({ x: win.x, y: win.y });
    setInitialMouse({ x: e.clientX, y: e.clientY });
  }, [win.id, win.width, win.height, win.x, win.y, focusWindow]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !win.isMaximized) {
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        updateWindowPosition(win.id, newX, newY);
      }
      if (isResizing && !win.isMaximized) {
        const dx = e.clientX - initialMouse.x;
        const dy = e.clientY - initialMouse.y;
        let newWidth = initialSize.width;
        let newHeight = initialSize.height;
        let newX = initialPos.x;
        let newY = initialPos.y;

        if (resizeDir.includes("e")) newWidth = Math.max(400, initialSize.width + dx);
        if (resizeDir.includes("w")) {
          newWidth = Math.max(400, initialSize.width - dx);
          newX = initialPos.x + (initialSize.width - newWidth);
        }
        if (resizeDir.includes("s")) newHeight = Math.max(300, initialSize.height + dy);
        if (resizeDir.includes("n")) {
          newHeight = Math.max(300, initialSize.height - dy);
          newY = initialPos.y + (initialSize.height - newHeight);
        }

        updateWindowSize(win.id, newWidth, newHeight);
        if (resizeDir.includes("w") || resizeDir.includes("n")) {
          updateWindowPosition(win.id, newX, newY);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, initialMouse, initialSize, initialPos, resizeDir, win.id, win.isMaximized, updateWindowPosition, updateWindowSize]);

  if (win.isMinimized) return null;

  const windowStyle = win.isMaximized
    ? { left: 8, top: 8, right: 8, bottom: 56, width: "auto", height: "auto" }
    : { left: win.x, top: win.y, width: win.width, height: win.height };

  return (
    <div
      ref={windowRef}
      className="absolute flex flex-col rounded-lg overflow-hidden shadow-2xl border border-white/10 dark:border-white/5"
      style={{
        ...windowStyle,
        zIndex: win.zIndex,
        backgroundColor: "rgba(30, 30, 35, 0.95)",
        backdropFilter: "blur(20px)",
      }}
      onClick={() => focusWindow(win.id)}
      data-testid={`window-${win.appId}`}
    >
      {/* Title Bar */}
      <div
        className="h-8 flex items-center justify-between px-3 select-none cursor-grab active:cursor-grabbing bg-black/20 border-b border-white/5"
        onMouseDown={handleMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
      >
        <span className="text-sm font-medium text-white/90 truncate">{win.title}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 flex items-center justify-center group transition-colors"
            data-testid={`btn-minimize-${win.appId}`}
          >
            <Minus className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center group transition-colors"
            data-testid={`btn-maximize-${win.appId}`}
          >
            <Maximize2 className="w-1.5 h-1.5 text-green-900 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center group transition-colors"
            data-testid={`btn-close-${win.appId}`}
          >
            <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-background text-foreground">
        {children}
      </div>

      {/* Resize Handles */}
      {!win.isMaximized && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, "nw")} />
          <div className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize" onMouseDown={(e) => handleResizeStart(e, "ne")} />
          <div className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, "sw")} />
          <div className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, "se")} />
          <div className="absolute top-0 left-2 right-2 h-1 cursor-n-resize" onMouseDown={(e) => handleResizeStart(e, "n")} />
          <div className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize" onMouseDown={(e) => handleResizeStart(e, "s")} />
          <div className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize" onMouseDown={(e) => handleResizeStart(e, "w")} />
          <div className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize" onMouseDown={(e) => handleResizeStart(e, "e")} />
        </>
      )}
    </div>
  );
}
