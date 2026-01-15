import { useOS } from "@/lib/os-context";
import { Search, Power, User } from "lucide-react";
import { 
  Globe, Settings, Folder, Calculator, FileText, CloudSun, Music, 
  Gamepad2, Bomb, Terminal
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const iconMap: Record<string, React.ComponentType<any>> = {
  globe: Globe,
  settings: Settings,
  folder: Folder,
  calculator: Calculator,
  "file-text": FileText,
  "cloud-sun": CloudSun,
  music: Music,
  "gamepad-2": Gamepad2,
  bomb: Bomb,
  terminal: Terminal,
};

export function StartMenu() {
  const { apps, openWindow, startMenuOpen, setStartMenuOpen, shutdown } = useOS();
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const taskbar = document.querySelector('[data-testid="btn-start-menu"]');
        if (!taskbar?.contains(e.target as Node)) {
          setStartMenuOpen(false);
        }
      }
    };

    if (startMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [startMenuOpen, setStartMenuOpen]);

  if (!startMenuOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bottom-14 left-1/2 -translate-x-1/2 w-[600px] rounded-xl overflow-hidden z-50 shadow-2xl border border-white/10"
      style={{
        backgroundColor: "rgba(30, 30, 35, 0.95)",
        backdropFilter: "blur(20px)",
      }}
      data-testid="start-menu"
    >
      {/* Search Bar */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 text-sm"
            autoFocus
            data-testid="input-search-apps"
          />
        </div>
      </div>

      {/* Apps Grid */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wide">All Apps</h3>
        <div className="grid grid-cols-5 gap-2">
          {filteredApps.map(app => {
            const Icon = iconMap[app.icon] || Globe;
            return (
              <button
                key={app.id}
                onClick={() => {
                  openWindow(app.id);
                  setStartMenuOpen(false);
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                data-testid={`start-app-${app.id}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.color} shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-white/80 text-center truncate w-full">{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-white/80">User</span>
        </button>
        <button 
          onClick={shutdown}
          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/60 hover:text-red-400"
          data-testid="btn-power"
          title="Shutdown"
        >
          <Power className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
