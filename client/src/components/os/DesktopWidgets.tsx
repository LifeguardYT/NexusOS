import { useState, useRef, useEffect } from "react";
import { useOS, type DesktopWidget } from "@/lib/os-context";
import { X, Clock, Cloud, FileText, Cpu, Plus, GripVertical } from "lucide-react";

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-3xl font-bold text-white">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm text-white/60">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

function WeatherWidget() {
  const { settings } = useOS();
  const [weather] = useState({
    temp: 72,
    condition: "Sunny",
    high: 78,
    low: 65,
  });
  
  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex items-center gap-2">
        <Cloud className="w-10 h-10 text-yellow-400" />
        <div>
          <div className="text-2xl font-bold text-white">{weather.temp}°F</div>
          <div className="text-xs text-white/60">{weather.condition}</div>
        </div>
      </div>
      <div className="mt-auto flex justify-between text-xs text-white/50">
        <span>H: {weather.high}°</span>
        <span>L: {weather.low}°</span>
      </div>
    </div>
  );
}

function NotesWidget() {
  const [note, setNote] = useState(() => {
    return localStorage.getItem("widget-quick-note") || "";
  });
  
  useEffect(() => {
    localStorage.setItem("widget-quick-note", note);
  }, [note]);
  
  return (
    <div className="flex flex-col h-full p-1">
      <div className="text-xs font-medium text-white/60 mb-1 flex items-center gap-1">
        <FileText className="w-3 h-3" /> Quick Note
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Type a quick note..."
        className="flex-1 bg-transparent text-white text-sm resize-none outline-none placeholder:text-white/30"
      />
    </div>
  );
}

function StatsWidget() {
  const [stats, setStats] = useState({ cpu: 0, memory: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 30 + 10),
        memory: Math.floor(Math.random() * 20 + 40),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-blue-400" />
        <span className="text-xs text-white/60">System Stats</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-white/80">
            <span>CPU</span>
            <span>{stats.cpu}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${stats.cpu}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-white/80">
            <span>Memory</span>
            <span>{stats.memory}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${stats.memory}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Widget({ widget, onRemove, onDrag }: { 
  widget: DesktopWidget; 
  onRemove: () => void;
  onDrag: (x: number, y: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; widgetX: number; widgetY: number } | null>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widgetX: widget.x,
      widgetY: widget.y,
    };
  };
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onDrag(dragRef.current.widgetX + dx, dragRef.current.widgetY + dy);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onDrag]);
  
  const renderContent = () => {
    switch (widget.type) {
      case "clock": return <ClockWidget />;
      case "weather": return <WeatherWidget />;
      case "notes": return <NotesWidget />;
      case "stats": return <StatsWidget />;
    }
  };
  
  return (
    <div
      className="absolute rounded-xl backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl overflow-hidden group"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
      }}
      data-testid={`widget-${widget.type}`}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-6 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-white/5"
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-3 h-3 text-white/40" />
        <button
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
          data-testid={`remove-widget-${widget.id}`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="p-2 h-full pt-2 group-hover:pt-6 transition-all">
        {renderContent()}
      </div>
    </div>
  );
}

export function WidgetPicker({ onClose }: { onClose: () => void }) {
  const { addWidget, widgets } = useOS();
  
  const widgetTypes: { type: DesktopWidget["type"]; label: string; icon: typeof Clock; description: string }[] = [
    { type: "clock", label: "Clock", icon: Clock, description: "Current time and date" },
    { type: "weather", label: "Weather", icon: Cloud, description: "Weather conditions" },
    { type: "notes", label: "Quick Note", icon: FileText, description: "Sticky note widget" },
    { type: "stats", label: "System Stats", icon: Cpu, description: "CPU and memory usage" },
  ];
  
  const handleAdd = (type: DesktopWidget["type"]) => {
    addWidget(type);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 rounded-2xl p-6 w-80 border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Widget
        </h2>
        <div className="space-y-2">
          {widgetTypes.map(({ type, label, icon: Icon, description }) => {
            const count = widgets.filter(w => w.type === type).length;
            return (
              <button
                key={type}
                onClick={() => handleAdd(type)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                data-testid={`add-widget-${type}`}
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-white/50">{description}</div>
                </div>
                {count > 0 && (
                  <div className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded">
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          data-testid="close-widget-picker"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DesktopWidgets() {
  const { widgets, removeWidget, updateWidgetPosition } = useOS();
  
  return (
    <>
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          widget={widget}
          onRemove={() => removeWidget(widget.id)}
          onDrag={(x, y) => updateWidgetPosition(widget.id, x, y)}
        />
      ))}
    </>
  );
}
