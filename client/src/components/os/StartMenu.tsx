import { useOS } from "@/lib/os-context";
import { Search, Power, User, Trash2, Package } from "lucide-react";
import { 
  Globe, Settings, Folder, Calculator, FileText, CloudSun, Music, 
  Gamepad2, Bomb, Terminal, MessageSquare, Bell, Store
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
  "message-circle": MessageSquare,
  bell: Bell,
  store: Store,
};

interface InstalledAppInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  externalUrl?: string;
  isSystemApp: boolean;
}

const externalApps: InstalledAppInfo[] = [
  {
    id: "youtube",
    name: "YouTube",
    icon: <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center"><div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5" /></div>,
    color: "bg-red-600",
    externalUrl: "https://www.youtube.com",
    isSystemApp: false,
  },
  {
    id: "coolmathgames",
    name: "CoolMathGames",
    icon: <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">CM</div>,
    color: "bg-gradient-to-br from-blue-500 to-purple-600",
    externalUrl: "https://www.coolmathgames.com/",
    isSystemApp: false,
  },
  {
    id: "geometry-lessons-monster",
    name: "Geometry Lessons Monster",
    icon: <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-teal-600 rounded flex items-center justify-center text-white font-bold text-xs">GL</div>,
    color: "bg-gradient-to-br from-green-500 to-teal-600",
    externalUrl: "https://geometry-lessons.monster/",
    isSystemApp: false,
  },
];

interface ContextMenuState {
  x: number;
  y: number;
  appId: string;
  appName: string;
}

export function StartMenu() {
  const { apps, openWindow, startMenuOpen, setStartMenuOpen, shutdown, installedApps, uninstallApp } = useOS();
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const allDisplayedApps = [
    ...apps.map(app => ({
      id: app.id,
      name: app.name,
      icon: app.icon,
      color: app.color,
      isSystemApp: true,
      externalUrl: undefined,
    })),
    ...externalApps.filter(app => installedApps.includes(app.id)),
  ];

  const filteredApps = allDisplayedApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (app: typeof allDisplayedApps[0]) => {
    if (app.externalUrl) {
      openWindow("browser");
      localStorage.setItem("browser-navigate-url", app.externalUrl);
    } else {
      openWindow(app.id);
    }
    setStartMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent, app: typeof allDisplayedApps[0]) => {
    e.preventDefault();
    e.stopPropagation();
    if (!app.isSystemApp) {
      setContextMenu({ x: e.clientX, y: e.clientY, appId: app.id, appName: app.name });
    }
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleUninstall = () => {
    if (contextMenu) {
      uninstallApp(contextMenu.appId);
      closeContextMenu();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const taskbar = document.querySelector('[data-testid="btn-start-menu"]');
        if (!taskbar?.contains(e.target as Node)) {
          setStartMenuOpen(false);
          closeContextMenu();
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
      onClick={closeContextMenu}
      data-testid="start-menu"
    >
      {contextMenu && (
        <div 
          className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-[60] min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
            {contextMenu.appName}
          </div>
          <button
            onClick={handleUninstall}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            data-testid="ctx-uninstall-start"
          >
            <Trash2 className="w-4 h-4" />
            Uninstall
          </button>
        </div>
      )}

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
            const isExternal = 'externalUrl' in app && app.externalUrl;
            const IconComponent = typeof app.icon === 'string' ? iconMap[app.icon] || Globe : null;
            
            return (
              <button
                key={app.id}
                onClick={() => handleAppClick(app)}
                onContextMenu={(e) => handleContextMenu(e, app)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group relative"
                data-testid={`start-app-${app.id}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.color} shadow-lg group-hover:scale-105 transition-transform`}>
                  {IconComponent ? (
                    <IconComponent className="w-6 h-6 text-white" />
                  ) : (
                    app.icon
                  )}
                </div>
                <span className="text-xs text-white/80 text-center truncate w-full">{app.name}</span>
                {!app.isSystemApp && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-400" title="Installed App" />
                )}
              </button>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No apps found</p>
          </div>
        )}
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
